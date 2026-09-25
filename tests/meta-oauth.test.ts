import test from "node:test";
import assert from "node:assert/strict";
import { buildMetaAuthorizationUrl, META_OAUTH_SCOPES } from "../lib/meta";

test("Meta OAuth usa o fluxo simples por padrão e só ativa config_id explicitamente", () => {
  const original = {
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_REDIRECT_URI: process.env.META_REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    META_LOGIN_CONFIG_ID: process.env.META_LOGIN_CONFIG_ID,
    META_USE_LOGIN_CONFIG: process.env.META_USE_LOGIN_CONFIG,
  };

  try {
    process.env.META_APP_ID = "123456";
    process.env.META_APP_SECRET = "test-secret";
    process.env.META_REDIRECT_URI =
      "https://example.com/api/oauth/meta/callback";
    process.env.META_LOGIN_CONFIG_ID = "config-123";
    delete process.env.META_USE_LOGIN_CONFIG;

    const simpleUrl = buildMetaAuthorizationUrl("state-1");

    assert.equal(simpleUrl.searchParams.get("config_id"), null);
    assert.equal(
      simpleUrl.searchParams.get("scope"),
      META_OAUTH_SCOPES.join(","),
    );

    process.env.META_USE_LOGIN_CONFIG = "true";

    const configuredUrl = buildMetaAuthorizationUrl("state-2");

    assert.equal(configuredUrl.searchParams.get("config_id"), "config-123");
    assert.equal(configuredUrl.searchParams.get("scope"), null);
    assert.equal(
      configuredUrl.searchParams.get("override_default_response_type"),
      "true",
    );
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
