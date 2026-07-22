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
