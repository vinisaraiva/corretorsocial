const DEFAULT_INSTAGRAM_GRAPH_VERSION = "v26.0";

export const INSTAGRAM_OAUTH_STATE_COOKIE = "cs_instagram_oauth_state";

export const INSTAGRAM_OAUTH_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const;

type InstagramTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  user_id?: string | number;
  permissions?: string;
};

type InstagramProfileResponse = {
  id?: string;
  user_id?: string | number;
  username?: string;
  name?: string;
  account_type?: string;
};

type InstagramApiError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
  error_type?: string;
  error_message?: string;
  code?: number;
};

function graphVersion() {
  const configured =
    process.env.INSTAGRAM_GRAPH_VERSION?.trim() ||
    process.env.META_GRAPH_VERSION?.trim();

  return configured && /^v\d+\.\d+$/.test(configured)
    ? configured
    : DEFAULT_INSTAGRAM_GRAPH_VERSION;
}

export function instagramIntegrationMissingConfiguration() {
  const missing: string[] = [];

  if (!process.env.INSTAGRAM_APP_ID?.trim()) {
    missing.push("INSTAGRAM_APP_ID");
  }

  if (!process.env.INSTAGRAM_APP_SECRET?.trim()) {
    missing.push("INSTAGRAM_APP_SECRET");
  }

  const explicitRedirect = process.env.INSTAGRAM_REDIRECT_URI?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!explicitRedirect && !appUrl) {
    missing.push("INSTAGRAM_REDIRECT_URI ou NEXT_PUBLIC_APP_URL");
  }

  return missing;
}

function requiredInstagramEnv() {
  const missing = instagramIntegrationMissingConfiguration();

  if (missing.length > 0) {
    throw new Error(
      `A integração Instagram ainda não está configurada no servidor: ${missing.join(", ")}.`,
    );
  }

  const appId = process.env.INSTAGRAM_APP_ID!.trim();
  const appSecret = process.env.INSTAGRAM_APP_SECRET!.trim();
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, "")}/api/oauth/instagram/callback`;

  return { appId, appSecret, redirectUri };
}

export function instagramIntegrationConfigured() {
  return instagramIntegrationMissingConfiguration().length === 0;
}

export function buildInstagramAuthorizationUrl(state: string) {
  const { appId, redirectUri } = requiredInstagramEnv();
  const url = new URL("https://www.instagram.com/oauth/authorize");

  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", INSTAGRAM_OAUTH_SCOPES.join(","));
  url.searchParams.set("state", state);

  return url;
}

async function parseInstagramResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as T &
    InstagramApiError;

  if (!response.ok || payload.error || payload.error_message) {
    const message =
      payload.error?.message ||
      payload.error_message ||
      "Instagram API request failed";
    const code = payload.error?.code || payload.code;

    throw new Error(code ? `${message} (#${code})` : message);
  }

  return payload as T;
}

async function exchangeInstagramShortLivedToken(code: string) {
  const { appId, appSecret, redirectUri } = requiredInstagramEnv();

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }).toString(),
    cache: "no-store",
  });

  const token = await parseInstagramResponse<InstagramTokenResponse>(response);

  if (!token.access_token) {
    throw new Error("Instagram não retornou o token de acesso temporário.");
  }

  return token.access_token;
}

async function exchangeInstagramLongLivedToken(shortLivedToken: string) {
  const { appSecret } = requiredInstagramEnv();
  const url = new URL(
    `https://graph.instagram.com/${graphVersion()}/access_token`,
  );

  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("access_token", shortLivedToken);

  const response = await fetch(url, { cache: "no-store" });
  const token = await parseInstagramResponse<InstagramTokenResponse>(response);

  if (!token.access_token) {
    throw new Error("Instagram não retornou o token de longa duração.");
  }

  return token;
}

async function getInstagramProfile(accessToken: string) {
  const url = new URL(
    `https://graph.instagram.com/${graphVersion()}/me`,
  );

  url.searchParams.set("fields", "id,user_id,username,name,account_type");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { cache: "no-store" });
  const profile =
    await parseInstagramResponse<InstagramProfileResponse>(response);

  const userId =
    typeof profile.user_id === "number"
      ? String(profile.user_id)
      : profile.user_id || profile.id;

  if (!userId || !profile.username) {
    throw new Error(
      "Instagram não retornou uma conta profissional válida.",
    );
  }

  return {
    id: userId,
    username: profile.username,
    name: profile.name ?? null,
    accountType: profile.account_type ?? null,
  };
}

export async function exchangeInstagramAuthorizationCode(code: string) {
  const shortLivedToken = await exchangeInstagramShortLivedToken(code);
  const longLived = await exchangeInstagramLongLivedToken(shortLivedToken);
  const profile = await getInstagramProfile(longLived.access_token!);

  return {
    accessToken: longLived.access_token!,
    expiresAt:
      typeof longLived.expires_in === "number"
        ? new Date(Date.now() + longLived.expires_in * 1000).toISOString()
        : null,
    profile,
  };
}
