import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { publicAppUrl } from "@/lib/app-url";
import {
  INSTAGRAM_OAUTH_STATE_COOKIE,
  exchangeInstagramAuthorizationCode,
} from "@/lib/instagram";
import { encryptSocialSecret } from "@/lib/social-token-crypto";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeStateMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function redirectWithStatus(request: NextRequest, status: string) {
  return NextResponse.redirect(
    publicAppUrl(
      request,
      `/configuracoes?instagram=${encodeURIComponent(status)}`,
    ),
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(publicAppUrl(request, "/login"));
  }

  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(
    INSTAGRAM_OAUTH_STATE_COOKIE,
  )?.value;

  if (error) {
    const response = redirectWithStatus(request, "denied");
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  }

  if (
    !code ||
    !state ||
    !expectedState ||
    !safeStateMatch(state, expectedState)
  ) {
    const response = redirectWithStatus(request, "invalid_state");
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  }

  try {
    const connection = await exchangeInstagramAuthorizationCode(code);

    const { error: disconnectError } = await supabase
      .from("social_connections")
      .update({
        status: "disconnected",
        token_secret_ref: null,
        expires_at: null,
      })
      .eq("user_id", user.id)
      .eq("provider", "instagram");

    if (disconnectError) {
      throw disconnectError;
    }

    const { error: upsertError } = await supabase
      .from("social_connections")
      .upsert(
        {
          user_id: user.id,
          provider: "instagram",
          external_account_id: connection.profile.id,
          display_name: `@${connection.profile.username}`,
          status: "connected",
          token_secret_ref: encryptSocialSecret(connection.accessToken),
          expires_at: connection.expiresAt,
          metadata: {
            source: "instagram_business_login",
            auth_mode: "instagram_login",
            username: connection.profile.username,
            name: connection.profile.name,
            account_type: connection.profile.accountType,
          },
        },
        {
          onConflict: "user_id,provider,external_account_id",
        },
      );

    if (upsertError) {
      throw upsertError;
    }

    const response = redirectWithStatus(request, "connected");
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  } catch (errorValue) {
    console.error("Instagram OAuth callback failed", errorValue);
    const response = redirectWithStatus(request, "failed");
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  }
}
