import { decryptSocialSecret } from "@/lib/social-token-crypto";

export type PendingMetaOAuth = {
  accessToken: string;
  expiresAt: string | null;
};

export function readPendingMetaOAuth(value: string): PendingMetaOAuth {
  const parsed = JSON.parse(decryptSocialSecret(value)) as Partial<PendingMetaOAuth>;

  if (!parsed.accessToken || typeof parsed.accessToken !== "string") {
    throw new Error("Sessão temporária da Meta inválida.");
  }

  return {
    accessToken: parsed.accessToken,
    expiresAt:
      typeof parsed.expiresAt === "string" ? parsed.expiresAt : null,
  };
}
