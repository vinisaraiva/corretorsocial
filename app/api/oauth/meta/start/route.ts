import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  META_OAUTH_STATE_COOKIE,
  buildMetaAuthorizationUrl,
  metaIntegrationConfigured,
} from "@/lib/meta";
import { socialTokenEncryptionConfigured } from "@/lib/social-token-crypto";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!metaIntegrationConfigured() || !socialTokenEncryptionConfigured()) {
    return NextResponse.redirect(
      new URL("/configuracoes?meta=missing_config", request.url),
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
