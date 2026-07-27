import { describe, it, expect, afterEach } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { saveUploadedFile, deleteUploadedFile, StorageNotConfiguredError } from "@/lib/storage";

// No SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are set in the test environment,
// and Vitest runs with NODE_ENV=test (not "production"), so every call here
// exercises the local-disk fallback path — the same one dev uses.

function makeFile(name: string, contents = "test-bytes", type = "image/png"): File {
  return new File([contents], name, { type });
}

describe("storage adapter — local-disk fallback (dev/test only)", () => {
  const written: { key: string }[] = [];

  afterEach(async () => {
    while (written.length > 0) {
      const { key } = written.pop()!;
      await deleteUploadedFile("AVATAR", key);
    }
  });

  it("saves a file and returns a key/url rooted at the given folder", async () => {
    const file = makeFile("profile.png");
    const stored = await saveUploadedFile(file, "AVATAR", "avatars");
    written.push(stored);

    expect(stored.key.startsWith("avatars/")).toBe(true);
    expect(stored.url).toBe(`/uploads/${stored.key}`);
    expect(stored.filename).toBe("profile.png");
    expect(stored.mimeType).toBe("image/png");
    expect(stored.sizeBytes).toBeGreaterThan(0);

    const onDisk = path.join(process.cwd(), "public", "uploads", stored.key);
    expect(existsSync(onDisk)).toBe(true);
  });

  it("generates a unique key per upload even for the same original filename (prevents collisions)", async () => {
    const a = await saveUploadedFile(makeFile("same-name.png"), "AVATAR", "avatars");
    const b = await saveUploadedFile(makeFile("same-name.png"), "AVATAR", "avatars");
    written.push(a, b);

    expect(a.key).not.toBe(b.key);
  });

  it("strips path separators from the original filename so traversal segments can never reach the filesystem as directories", async () => {
    const file = makeFile("../../../etc/passwd.png");
    const stored = await saveUploadedFile(file, "AVATAR", "avatars");
    written.push(stored);

    // Dots are legitimately allowed in filenames (extensions, versioned
    // names) — the actual safety property is that no "/" or "\" survives,
    // so the traversal segments become literal dots in one flat filename,
    // never directory hops.
    expect(stored.key).not.toContain("/etc/");
    expect(stored.key.split("/")).toHaveLength(2); // exactly "avatars/<file>" — no extra path segments smuggled in

    const uploadsRoot = path.join(process.cwd(), "public", "uploads");
    const onDisk = path.join(uploadsRoot, stored.key);
    // Resolves inside the uploads dir, never above it.
    expect(path.resolve(onDisk).startsWith(uploadsRoot)).toBe(true);
  });

  it("deleteUploadedFile removes the file from disk", async () => {
    const stored = await saveUploadedFile(makeFile("to-delete.png"), "AVATAR", "avatars");
    const onDisk = path.join(process.cwd(), "public", "uploads", stored.key);
    expect(existsSync(onDisk)).toBe(true);

    await deleteUploadedFile("AVATAR", stored.key);
    expect(existsSync(onDisk)).toBe(false);
  });

  it("deleteUploadedFile is safe to call on an already-missing file", async () => {
    await expect(deleteUploadedFile("AVATAR", "avatars/does-not-exist.png")).resolves.toBeUndefined();
  });
});

describe("storage adapter — production safety guard", () => {
  it("throws StorageNotConfiguredError instead of silently writing to local disk when NODE_ENV=production and Supabase is unset", async () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error — NODE_ENV is readonly in the type, but assignable at runtime.
    process.env.NODE_ENV = "production";
    try {
      await expect(
        saveUploadedFile(makeFile("prod-test.png"), "AVATAR", "avatars")
      ).rejects.toThrow(StorageNotConfiguredError);
    } finally {
      // @ts-expect-error — see above.
      process.env.NODE_ENV = originalEnv;
    }
  });
});
