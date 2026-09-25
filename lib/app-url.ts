function normalizedConfiguredOrigin(value: string | undefined) {
  const configured = value?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function firstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function usableHost(value: string | null) {
  if (!value) return false;

  const hostname = value.split(":")[0]?.toLowerCase();

  return (
    Boolean(hostname) &&
    hostname !== "0.0.0.0" &&
    hostname !== "::" &&
    hostname !== "[::]"
  );
}

export function publicAppOrigin(request: Request) {
  const configuredApp = normalizedConfiguredOrigin(
    process.env.NEXT_PUBLIC_APP_URL,
  );

  if (configuredApp) return configuredApp;

  const metaRedirectOrigin = normalizedConfiguredOrigin(
    process.env.META_REDIRECT_URI,
  );

  if (metaRedirectOrigin) return metaRedirectOrigin;

  const forwardedHost = firstForwardedValue(
    request.headers.get("x-forwarded-host"),
  );
  const forwardedProto =
    firstForwardedValue(request.headers.get("x-forwarded-proto")) || "https";

  if (
    usableHost(forwardedHost) &&
    (forwardedProto === "https" || forwardedProto === "http")
  ) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = firstForwardedValue(request.headers.get("host"));

  if (usableHost(host)) {
    const protocol =
      process.env.NODE_ENV === "production" ? "https" : "http";

    return `${protocol}://${host}`;
  }

  const requestUrl = new URL(request.url);

  if (usableHost(requestUrl.host) || process.env.NODE_ENV !== "production") {
    return requestUrl.origin;
  }

  throw new Error(
    "Não foi possível determinar a URL pública da aplicação. Configure NEXT_PUBLIC_APP_URL.",
  );
}

export function publicAppUrl(request: Request, path: string) {
  return new URL(path, publicAppOrigin(request));
}
