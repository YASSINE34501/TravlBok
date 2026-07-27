import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { isSupabaseStorageConfigured, isProduction } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/storage/supabase-client";
import {
  getBucketForPurpose,
  isPublicBucket,
  SIGNED_URL_EXPIRY_SECONDS,
  type StorageBucket,
} from "@/lib/storage/config";
import type { UploadPurpose } from "@/generated/prisma/client";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const LOCAL_URL_PREFIX = "/uploads";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "File storage is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. " +
        "Local-disk storage is only available outside production."
    );
    this.name = "StorageNotConfiguredError";
  }
}

export type StoredFile = { key: string; url: string };

/** Strips path separators and anything outside a safe charset — the result can never escape its upload folder. */
function sanitizeFilename(filename: string): string {
  const base = filename.replace(/[/\\]/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(-100) || "file";
}

function buildKey(folder: string, originalFilename: string): string {
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "_").replace(/^\/+|\/+$/g, "");
  return `${safeFolder}/${randomUUID()}-${sanitizeFilename(originalFilename)}`;
}

function usesLocalDisk(): boolean {
  if (isSupabaseStorageConfigured()) return false;
  if (isProduction()) throw new StorageNotConfiguredError();
  return true;
}

async function saveLocal(buffer: Buffer, key: string): Promise<StoredFile> {
  await mkdir(path.join(LOCAL_UPLOAD_DIR, path.dirname(key)), { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, key), buffer);
  return { key, url: `${LOCAL_URL_PREFIX}/${key}` };
}

async function deleteLocal(key: string): Promise<void> {
  try {
    await unlink(path.join(LOCAL_UPLOAD_DIR, key));
  } catch {
    // Already gone — safe to ignore for a delete operation.
  }
}

async function urlForObject(bucket: StorageBucket, key: string): Promise<string> {
  const supabase = getSupabaseAdminClient();
  if (isPublicBucket(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(key).data.publicUrl;
  }
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, SIGNED_URL_EXPIRY_SECONDS);
  if (error || !data) {
    throw new Error(`Failed to create signed URL for ${bucket}/${key}: ${error?.message ?? "unknown error"}`);
  }
  return data.signedUrl;
}

async function saveSupabase(
  buffer: Buffer,
  bucket: StorageBucket,
  key: string,
  mimeType: string
): Promise<StoredFile> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Failed to upload to ${bucket}/${key}: ${error.message}`);
  }
  const url = await urlForObject(bucket, key);
  return { key, url };
}

export async function saveUploadedFile(
  file: File,
  purpose: UploadPurpose,
  folder: string
): Promise<StoredFile & { filename: string; mimeType: string; sizeBytes: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const key = buildKey(folder, file.name);

  const stored = usesLocalDisk()
    ? await saveLocal(buffer, key)
    : await saveSupabase(buffer, getBucketForPurpose(purpose), key, file.type);

  return {
    ...stored,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buffer.byteLength,
  };
}

export async function deleteUploadedFile(purpose: UploadPurpose, key: string): Promise<void> {
  if (usesLocalDisk()) {
    await deleteLocal(key);
    return;
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(getBucketForPurpose(purpose)).remove([key]);
  if (error) {
    throw new Error(`Failed to delete ${getBucketForPurpose(purpose)}/${key}: ${error.message}`);
  }
}

/** Regenerates a fresh signed URL for a private-bucket object — call when a previously-stored signed URL may have expired. No-op-equivalent for public buckets (returns the same permanent public URL). */
export async function getFreshFileUrl(purpose: UploadPurpose, key: string): Promise<string> {
  if (usesLocalDisk()) {
    return `${LOCAL_URL_PREFIX}/${key}`;
  }
  return urlForObject(getBucketForPurpose(purpose), key);
}
