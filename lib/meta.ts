const DEFAULT_META_GRAPH_VERSION = "v26.0";

export const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
] as const;

export type MetaInstagramAccount = {
  id: string;
  username?: string;
  name?: string;
};

export type MetaPageAccount = {
  id: string;
  name: string;
  access_token: string;
  tasks?: string[];
  instagram_business_account?: MetaInstagramAccount;
};

type MetaTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type MetaGraphError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

function metaGraphVersion() {
  const configured = process.env.META_GRAPH_VERSION?.trim();

  return configured && /^v\d+\.\d+$/.test(configured)
    ? configured
    : DEFAULT_META_GRAPH_VERSION;
}

function requiredMetaEnv() {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const redirectUri =
    process.env.META_REDIRECT_URI?.trim() ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/oauth/meta/callback`
      : "");

  if (!appId || !appSecret || !redirectUri) {
    throw new Error("A integração Meta ainda não está configurada no servidor.");
  }

  return { appId, appSecret, redirectUri };
}

export function metaIntegrationConfigured() {
  try {
    requiredMetaEnv();
    return true;
  } catch {
    return false;
  }
}

export function buildMetaAuthorizationUrl(state: string) {
  const { appId, redirectUri } = requiredMetaEnv();
  const version = metaGraphVersion();
  const url = new URL(`https://www.facebook.com/${version}/dialog/oauth`);

  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");

  const configId = process.env.META_LOGIN_CONFIG_ID?.trim();

  if (configId) {
    url.searchParams.set("config_id", configId);
    url.searchParams.set("override_default_response_type", "true");
  } else {
    url.searchParams.set("scope", META_OAUTH_SCOPES.join(","));
  }

  return url;
}

async function parseMetaResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as T & MetaGraphError;

  if (!response.ok || payload.error) {
    const metaError = payload.error;
    const code = metaError?.code ? ` (#${metaError.code})` : "";
    throw new Error(
      `A Meta recusou a solicitação${code}. Verifique a configuração e as permissões do aplicativo.`,
    );
  }

  return payload as T;
}

async function exchangeToken(params: URLSearchParams) {
  const version = metaGraphVersion();
  const response = await fetch(
    `https://graph.facebook.com/${version}/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    },
  );

  return parseMetaResponse<MetaTokenResponse>(response);
}

export async function exchangeMetaAuthorizationCode(code: string) {
  const { appId, appSecret, redirectUri } = requiredMetaEnv();

  const shortLived = await exchangeToken(
    new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    }),
  );

  const longLived = await exchangeToken(
    new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLived.access_token,
    }),
  );

  return {
    accessToken: longLived.access_token,
    expiresAt:
      typeof longLived.expires_in === "number"
        ? new Date(Date.now() + longLived.expires_in * 1000).toISOString()
        : null,
  };
}

export async function listMetaPages(userAccessToken: string) {
  const version = metaGraphVersion();
  const fields = [
    "id",
    "name",
    "access_token",
    "tasks",
    "instagram_business_account{id,username,name}",
  ].join(",");

  const url = new URL(`https://graph.facebook.com/${version}/me/accounts`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "100");

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${userAccessToken}`,
    },
    cache: "no-store",
  });

  const payload = await parseMetaResponse<{ data?: MetaPageAccount[] }>(response);

  return (payload.data ?? []).filter(
    (page): page is MetaPageAccount =>
      Boolean(page.id && page.name && page.access_token),
  );
}
