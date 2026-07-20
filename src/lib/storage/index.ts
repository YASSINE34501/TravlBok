import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const LOCAL_URL_PREFIX = "/uploads";

const isS3Configured = Boolean(
  process.env.STORAGE_ENDPOINT &&
    process.env.STORAGE_BUCKET &&
    process.env.STORAGE_ACCESS_KEY_ID &&
    process.env.STORAGE_SECRET_ACCESS_KEY
);

export type StoredFile = {
  key: string;
  url: string;
};

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

async function saveLocal(
  buffer: Buffer,
  key: string
): Promise<StoredFile> {
  await mkdir(path.join(UPLOAD_DIR, path.dirname(key)), { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
  return { key, url: `${LOCAL_URL_PREFIX}/${key}` };
}

async function saveS3(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<StoredFile> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || "auto",
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  const publicBase = process.env.STORAGE_PUBLIC_URL?.replace(/\/$/, "");
  const url = publicBase
    ? `${publicBase}/${key}`
    : `${process.env.STORAGE_ENDPOINT}/${process.env.STORAGE_BUCKET}/${key}`;

  return { key, url };
}

export async function saveUploadedFile(
  file: File,
  folder: string
): Promise<StoredFile & { filename: string; mimeType: string; sizeBytes: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const key = `${folder}/${randomUUID()}-${sanitizeFilename(file.name)}`;

  const stored = isS3Configured
    ? await saveS3(buffer, key, file.type)
    : await saveLocal(buffer, key);

  return {
    ...stored,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buffer.byteLength,
  };
}

export async function deleteUploadedFile(key: string): Promise<void> {
  if (isS3Configured) {
    const { S3Client, DeleteObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );
    const client = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION || "auto",
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.STORAGE_BUCKET,
        Key: key,
      })
    );
    return;
  }

  try {
    await unlink(path.join(UPLOAD_DIR, key));
  } catch {
    // File may already be gone — safe to ignore for a delete operation.
  }
}
