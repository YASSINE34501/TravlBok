import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

/**
 * AES-256-GCM encryption for channel-connection credentials at rest
 * ("secure credential storage" per MASTER-PLAN's Channel Manager and
 * Security sections). Uses CHANNEL_CREDENTIALS_ENCRYPTION_KEY if set
 * (recommended for production — any 32+ byte random string); falls back to
 * deriving a key from AUTH_SECRET (already required) via SHA-256 so this
 * works out of the box in development without a second secret to manage.
 */
function getEncryptionKey(): Buffer {
  const explicitKey = process.env.CHANNEL_CREDENTIALS_ENCRYPTION_KEY;
  const material = explicitKey || process.env.AUTH_SECRET;
  if (!material) {
    throw new Error(
      "Cannot encrypt channel credentials: set CHANNEL_CREDENTIALS_ENCRYPTION_KEY or AUTH_SECRET"
    );
  }
  return createHash("sha256").update(material).digest();
}

export type EncryptedSecret = { ciphertext: string; iv: string };

export function encryptSecret(plaintext: string): EncryptedSecret {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptSecret(encrypted: EncryptedSecret): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, "base64");
  const combined = Buffer.from(encrypted.ciphertext, "base64");
  const authTag = combined.subarray(combined.length - 16);
  const ciphertext = combined.subarray(0, combined.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8");
}

export function encryptJson(value: Record<string, unknown>): EncryptedSecret {
  return encryptSecret(JSON.stringify(value));
}

export function decryptJson<T = Record<string, unknown>>(encrypted: EncryptedSecret): T {
  return JSON.parse(decryptSecret(encrypted)) as T;
}
