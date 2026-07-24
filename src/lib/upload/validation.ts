import type { UploadPurpose } from "@/generated/prisma/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

const PURPOSE_RULES: Record<
  UploadPurpose,
  { allowedTypes: string[]; maxSizeBytes: number; folder: string }
> = {
  LEGAL_DOCUMENT: {
    allowedTypes: DOCUMENT_TYPES,
    maxSizeBytes: 10 * 1024 * 1024,
    folder: "documents",
  },
  PROPERTY_PHOTO: {
    allowedTypes: IMAGE_TYPES,
    maxSizeBytes: 8 * 1024 * 1024,
    folder: "hotels",
  },
  PROPERTY_VIDEO: {
    allowedTypes: VIDEO_TYPES,
    maxSizeBytes: 100 * 1024 * 1024,
    folder: "hotels",
  },
  ROOM_PHOTO: {
    allowedTypes: IMAGE_TYPES,
    maxSizeBytes: 8 * 1024 * 1024,
    folder: "rooms",
  },
  ROOM_VIDEO: {
    allowedTypes: VIDEO_TYPES,
    maxSizeBytes: 100 * 1024 * 1024,
    folder: "rooms",
  },
  VEHICLE_PHOTO: {
    allowedTypes: IMAGE_TYPES,
    maxSizeBytes: 8 * 1024 * 1024,
    folder: "vehicles",
  },
  VEHICLE_VIDEO: {
    allowedTypes: VIDEO_TYPES,
    maxSizeBytes: 100 * 1024 * 1024,
    folder: "vehicles",
  },
  AVATAR: {
    allowedTypes: IMAGE_TYPES,
    maxSizeBytes: 3 * 1024 * 1024,
    folder: "avatars",
  },
  PROMO_MATERIAL: {
    allowedTypes: [...IMAGE_TYPES, ...VIDEO_TYPES],
    maxSizeBytes: 50 * 1024 * 1024,
    folder: "promo-materials",
  },
  OTHER: {
    allowedTypes: [...DOCUMENT_TYPES, ...VIDEO_TYPES],
    maxSizeBytes: 20 * 1024 * 1024,
    folder: "misc",
  },
};

export function getUploadRules(purpose: UploadPurpose) {
  return PURPOSE_RULES[purpose];
}

export function validateUploadedFile(
  file: File,
  purpose: UploadPurpose
): { valid: true } | { valid: false; error: "invalidFileType" | "fileTooLarge" } {
  const rules = getUploadRules(purpose);

  if (!rules.allowedTypes.includes(file.type)) {
    return { valid: false, error: "invalidFileType" };
  }

  if (file.size > rules.maxSizeBytes) {
    return { valid: false, error: "fileTooLarge" };
  }

  return { valid: true };
}

const MAGIC_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/webp": (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // "WEBP"
  "application/pdf": (b) =>
    b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // "%PDF"
  "video/mp4": (b) =>
    b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70, // "ftyp" box
  "video/quicktime": (b) =>
    b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70, // "ftyp" box (MOV shares the ISO base media container)
  "video/webm": (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3, // EBML header
};

/**
 * `file.type` is a client-supplied MIME string and trivially spoofable (an
 * attacker can label an HTML/SVG/script payload as "image/jpeg"). This reads
 * the file's actual leading bytes and checks them against the declared
 * type's real file signature — defense against MIME spoofing that the
 * allowlist in `validateUploadedFile` alone can't catch.
 */
export function validateFileSignature(buffer: Buffer, declaredType: string): boolean {
  const check = MAGIC_SIGNATURES[declaredType];
  if (!check) return true; // no signature known for this type — allowlist already restricted `declaredType` itself
  return check(new Uint8Array(buffer.subarray(0, 16)));
}
