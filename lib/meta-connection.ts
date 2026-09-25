import "server-only";

import { encryptSocialSecret } from "@/lib/social-token-crypto";
import { createClient } from "@/lib/supabase/server";
import type { MetaPageAccount } from "@/lib/meta";
import type { PendingMetaOAuth } from "@/lib/meta-oauth-session";
import type { Database } from "@/types/database";

type SocialConnectionInsert =
  Database["public"]["Tables"]["social_connections"]["Insert"];

export async function persistMetaPageConnection({
  userId,
  page,
  pending,
}: {
  userId: string;
  page: MetaPageAccount;
  pending: PendingMetaOAuth;
}) {
  const supabase = await createClient();

  const { error: disconnectError } = await supabase
    .from("social_connections")
    .update({
      status: "disconnected",
      token_secret_ref: null,
      expires_at: null,
    })
    .eq("user_id", userId)
    .eq("provider", "facebook");

  if (disconnectError) {
    throw disconnectError;
  }

  const rows: SocialConnectionInsert[] = [
    {
      user_id: userId,
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

  const { error: upsertError } = await supabase
    .from("social_connections")
    .upsert(rows, {
      onConflict: "user_id,provider,external_account_id",
    });

  if (upsertError) {
    throw upsertError;
  }

  return {
    facebookPageId: page.id,
    facebookPageName: page.name,
  };
}
