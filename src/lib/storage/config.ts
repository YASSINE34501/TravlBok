import "server-only";
import type { UploadPurpose } from "@/generated/prisma/client";

export const STORAGE_BUCKETS = {
  PROPERTY_IMAGES: "property-images",
  VEHICLE_IMAGES: "vehicle-images",
  AVATARS: "avatars",
  PROMO_MATERIALS: "promo-materials",
  PARTNER_DOCUMENTS: "partner-documents",
  BOOKING_DOCUMENTS: "booking-documents",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const ALL_BUCKETS: StorageBucket[] = Object.values(STORAGE_BUCKETS);

/** Buckets whose objects are safe to serve via a permanent public URL. Everything else requires a signed URL. */
export const PUBLIC_BUCKETS: ReadonlySet<StorageBucket> = new Set([
  STORAGE_BUCKETS.PROPERTY_IMAGES,
  STORAGE_BUCKETS.VEHICLE_IMAGES,
  STORAGE_BUCKETS.AVATARS,
  STORAGE_BUCKETS.PROMO_MATERIALS,
]);

export function isPublicBucket(bucket: StorageBucket): boolean {
  return PUBLIC_BUCKETS.has(bucket);
}

/**
 * PROPERTY_PHOTO/VIDEO and ROOM_PHOTO/VIDEO share one bucket (both are
 * publicly-viewable listing media for a hotel) — VEHICLE_* gets its own,
 * matching how the marketing site queries/displays them separately.
 * LEGAL_DOCUMENT and the OTHER catch-all default to the private documents
 * bucket since an unclassified upload should never default to public.
 */
export function getBucketForPurpose(purpose: UploadPurpose): StorageBucket {
  switch (purpose) {
    case "PROPERTY_PHOTO":
    case "PROPERTY_VIDEO":
    case "ROOM_PHOTO":
    case "ROOM_VIDEO":
      return STORAGE_BUCKETS.PROPERTY_IMAGES;
    case "VEHICLE_PHOTO":
    case "VEHICLE_VIDEO":
      return STORAGE_BUCKETS.VEHICLE_IMAGES;
    case "AVATAR":
      return STORAGE_BUCKETS.AVATARS;
    case "PROMO_MATERIAL":
      return STORAGE_BUCKETS.PROMO_MATERIALS;
    case "LEGAL_DOCUMENT":
    case "OTHER":
      return STORAGE_BUCKETS.PARTNER_DOCUMENTS;
    default: {
      const _exhaustive: never = purpose;
      return _exhaustive;
    }
  }
}

/** Seconds a signed URL for a private-bucket object stays valid. */
export const SIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
