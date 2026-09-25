import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  META_OAUTH_STATE_COOKIE,
  buildMetaAuthorizationUrl,
  metaIntegrationConfigured,
} from "@/lib/meta";
import { socialTokenEncryptionConfigured } from "@/lib/social-token-crypto";
import { publicAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(publicAppUrl(request, "/login"));
  }

  if (!metaIntegrationConfigured() || !socialTokenEncryptionConfigured()) {
    console.error("Meta OAuth is missing server configuration", {
      metaConfigured: metaIntegrationConfigured(),
      encryptionConfigured: socialTokenEncryptionConfigured(),
    });

    return NextResponse.redirect(
      publicAppUrl(request, "/configuracoes?meta=missing_config"),
    );
  }

  const state = randomBytes(32).toString("base64url");
  const response = NextResponse.redirect(buildMetaAuthorizationUrl(state));

  response.cookies.set(META_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
