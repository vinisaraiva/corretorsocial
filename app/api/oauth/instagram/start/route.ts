import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { publicAppUrl } from "@/lib/app-url";
import {
  INSTAGRAM_OAUTH_STATE_COOKIE,
  buildInstagramAuthorizationUrl,
  instagramIntegrationConfigured,
  instagramIntegrationMissingConfiguration,
} from "@/lib/instagram";
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

  if (!instagramIntegrationConfigured()) {
    console.error("Instagram OAuth is missing server configuration", {
      missingInstagramConfiguration:
        instagramIntegrationMissingConfiguration(),
    });

    return NextResponse.redirect(
      publicAppUrl(
        request,
        "/configuracoes?instagram=missing_config",
      ),
    );
  }

  const state = randomBytes(32).toString("base64url");
  const response = NextResponse.redirect(
    buildInstagramAuthorizationUrl(state),
  );

  response.cookies.set(INSTAGRAM_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
