import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  META_OAUTH_PENDING_COOKIE,
  META_OAUTH_STATE_COOKIE,
  exchangeMetaAuthorizationCode,
} from "@/lib/meta";
import {
  encryptSocialSecret,
  socialTokenEncryptionConfigured,
} from "@/lib/social-token-crypto";
import { publicAppUrl } from "@/lib/app-url";
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
      `/configuracoes?meta=${encodeURIComponent(status)}`,
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

  if (!socialTokenEncryptionConfigured()) {
    return redirectWithStatus(request, "missing_config");
  }

  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(META_OAUTH_STATE_COOKIE)?.value;

  if (error) {
    const response = redirectWithStatus(request, "denied");
    response.cookies.delete(META_OAUTH_STATE_COOKIE);
    return response;
  }

  if (
    !code ||
    !state ||
    !expectedState ||
    !safeStateMatch(state, expectedState)
  ) {
    const response = redirectWithStatus(request, "invalid_state");
    response.cookies.delete(META_OAUTH_STATE_COOKIE);
    return response;
  }

  try {
    const token = await exchangeMetaAuthorizationCode(code);
    const encryptedPendingToken = encryptSocialSecret(JSON.stringify(token));
    const response = NextResponse.redirect(
      publicAppUrl(request, "/configuracoes/meta"),
    );

    response.cookies.delete(META_OAUTH_STATE_COOKIE);
    response.cookies.set(META_OAUTH_PENDING_COOKIE, encryptedPendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });

    return response;
  } catch (errorValue) {
    console.error("Meta OAuth callback failed", errorValue);
    const response = redirectWithStatus(request, "failed");
    response.cookies.delete(META_OAUTH_STATE_COOKIE);
    return response;
  }
}
