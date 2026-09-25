import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const SECRET_PREFIX = "enc:v1";

function encryptionKey() {
  const configured = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim();

  if (!configured) {
    throw new Error("Missing required environment variable: SOCIAL_TOKEN_ENCRYPTION_KEY");
  }

  const key = Buffer.from(configured, "base64");

  if (key.length !== 32) {
    throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY must contain exactly 32 bytes in Base64");
  }

  return key;
}

export function decryptSocialSecret(value: string) {
  const [prefix, ivValue, authTagValue, encryptedValue] = value.split(".");

  if (
    prefix !== SECRET_PREFIX ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue
  ) {
    throw new Error("Invalid encrypted social secret");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}


export function encryptSocialSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    SECRET_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}
