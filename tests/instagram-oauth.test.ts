import test from "node:test";
import assert from "node:assert/strict";
import {
  INSTAGRAM_OAUTH_SCOPES,
  buildInstagramAuthorizationUrl,
  instagramIntegrationMissingConfiguration,
} from "../lib/instagram";
import { META_OAUTH_SCOPES } from "../lib/meta";

test("Facebook e Instagram usam conjuntos de permissões independentes", () => {
  assert.deepEqual(META_OAUTH_SCOPES, [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
  ]);

  assert.deepEqual(INSTAGRAM_OAUTH_SCOPES, [
    "instagram_business_basic",
    "instagram_business_content_publish",
  ]);
});

test("Instagram OAuth usa credenciais e callback próprios", () => {
  const original = {
    INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID,
    INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  try {
    process.env.INSTAGRAM_APP_ID = "ig-app-123";
    process.env.INSTAGRAM_APP_SECRET = "ig-secret";
    process.env.INSTAGRAM_REDIRECT_URI =
      "https://example.com/api/oauth/instagram/callback";

    const url = buildInstagramAuthorizationUrl("state-123");

    assert.equal(url.origin, "https://www.instagram.com");
    assert.equal(url.pathname, "/oauth/authorize");
    assert.equal(url.searchParams.get("client_id"), "ig-app-123");
    assert.equal(
      url.searchParams.get("redirect_uri"),
      "https://example.com/api/oauth/instagram/callback",
    );
    assert.equal(url.searchParams.get("state"), "state-123");
    assert.equal(
      url.searchParams.get("scope"),
      INSTAGRAM_OAUTH_SCOPES.join(","),
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

test("Instagram exige credenciais específicas do produto", () => {
  const original = {
    INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID,
    INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  try {
    delete process.env.INSTAGRAM_APP_ID;
    delete process.env.INSTAGRAM_APP_SECRET;
    delete process.env.INSTAGRAM_REDIRECT_URI;
    delete process.env.NEXT_PUBLIC_APP_URL;

    assert.deepEqual(instagramIntegrationMissingConfiguration(), [
      "INSTAGRAM_APP_ID",
      "INSTAGRAM_APP_SECRET",
      "INSTAGRAM_REDIRECT_URI ou NEXT_PUBLIC_APP_URL",
    ]);
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
