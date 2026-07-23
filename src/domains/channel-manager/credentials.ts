import "server-only";
import { encryptJson, decryptJson } from "@/lib/crypto/secrets";
import type { ChannelCredentials } from "./providers/types";
import type { ChannelConnection } from "@/generated/prisma/client";

export function encryptChannelCredentials(credentials: ChannelCredentials) {
  const { ciphertext, iv } = encryptJson(credentials);
  return { credentialsCiphertext: ciphertext, credentialsIv: iv };
}

export function decryptChannelCredentials(
  connection: Pick<ChannelConnection, "credentialsCiphertext" | "credentialsIv">
): ChannelCredentials {
  if (!connection.credentialsCiphertext || !connection.credentialsIv) return {};
  try {
    return decryptJson<ChannelCredentials>({
      ciphertext: connection.credentialsCiphertext,
      iv: connection.credentialsIv,
    });
  } catch {
    return {};
  }
}
