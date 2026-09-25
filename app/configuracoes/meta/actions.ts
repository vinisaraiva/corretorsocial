"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  META_OAUTH_PENDING_COOKIE,
  listMetaPages,
  metaPageCanPublish,
} from "@/lib/meta";
import { readPendingMetaOAuth } from "@/lib/meta-oauth-session";
import { encryptSocialSecret } from "@/lib/social-token-crypto";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SocialConnectionInsert =
  Database["public"]["Tables"]["social_connections"]["Insert"];

export async function completeMetaConnection(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const pendingValue = cookieStore.get(META_OAUTH_PENDING_COOKIE)?.value;
  const pageId = String(formData.get("page_id") ?? "").trim();
  let destination = "/configuracoes?meta=failed";

  try {
    if (!pendingValue || !pageId) {
      destination = "/configuracoes?meta=expired";
    } else {
      const pending = readPendingMetaOAuth(pendingValue);
      const pages = await listMetaPages(pending.accessToken);
      const page = pages.find((candidate) => candidate.id === pageId);

      if (!page) {
        throw new Error("A Página selecionada não está mais disponível.");
      }

      if (!metaPageCanPublish(page)) {
        throw new Error(
          "Esta conta não tem permissão CREATE_CONTENT para a Página selecionada.",
        );
      }

      const { error: disconnectError } = await supabase
        .from("social_connections")
        .update({
          status: "disconnected",
          token_secret_ref: null,
          expires_at: null,
        })
        .eq("user_id", user.id)
        .in("provider", ["facebook", "instagram"]);

      if (disconnectError) {
        throw disconnectError;
      }

      const rows: SocialConnectionInsert[] = [
        {
          user_id: user.id,
          provider: "facebook",
          external_account_id: page.id,
          display_name: page.name,
          status: "connected",
          token_secret_ref: encryptSocialSecret(page.access_token),
          expires_at: null,
          metadata: {
            source: "meta_facebook_login",
            page_id: page.id,
            tasks: page.tasks ?? [],
            user_token_expires_at: pending.expiresAt,
          },
        },
      ];

      if (page.instagram_business_account?.id) {
        const instagram = page.instagram_business_account;

        rows.push({
          user_id: user.id,
          provider: "instagram",
          external_account_id: instagram.id,
          display_name: instagram.username
            ? `@${instagram.username}`
            : instagram.name || "Instagram",
          status: "connected",
          token_secret_ref: encryptSocialSecret(page.access_token),
          expires_at: null,
          metadata: {
            source: "meta_facebook_login",
            facebook_page_id: page.id,
            facebook_page_name: page.name,
            instagram_username: instagram.username ?? null,
            user_token_expires_at: pending.expiresAt,
          },
        });
      }

      const { error: upsertError } = await supabase
        .from("social_connections")
        .upsert(rows, {
          onConflict: "user_id,provider,external_account_id",
        });

      if (upsertError) {
        throw upsertError;
      }

      cookieStore.delete(META_OAUTH_PENDING_COOKIE);
      revalidatePath("/configuracoes");
      destination = "/configuracoes?meta=connected";
    }
  } catch (error) {
    console.error("Could not complete Meta connection", error);
  }

  redirect(destination);
}

export async function disconnectMeta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("social_connections")
    .update({
      status: "disconnected",
      token_secret_ref: null,
      expires_at: null,
    })
    .eq("user_id", user.id)
    .in("provider", ["facebook", "instagram"]);

  if (error) {
    console.error("Could not disconnect Meta accounts", error);
    redirect("/configuracoes?meta=disconnect_failed");
  }

  revalidatePath("/configuracoes");
  redirect("/configuracoes?meta=disconnected");
}
