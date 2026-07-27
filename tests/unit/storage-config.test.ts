import { describe, it, expect } from "vitest";
import {
  getBucketForPurpose,
  isPublicBucket,
  STORAGE_BUCKETS,
  ALL_BUCKETS,
} from "@/lib/storage/config";
import type { UploadPurpose } from "@/generated/prisma/client";

const ALL_PURPOSES: UploadPurpose[] = [
  "LEGAL_DOCUMENT",
  "PROPERTY_PHOTO",
  "PROPERTY_VIDEO",
  "ROOM_PHOTO",
  "ROOM_VIDEO",
  "VEHICLE_PHOTO",
  "VEHICLE_VIDEO",
  "AVATAR",
  "PROMO_MATERIAL",
  "OTHER",
];

describe("getBucketForPurpose", () => {
  it("maps every UploadPurpose to a known bucket (keeps this test honest if the enum grows)", () => {
    for (const purpose of ALL_PURPOSES) {
      expect(ALL_BUCKETS).toContain(getBucketForPurpose(purpose));
    }
  });

  it("routes property and room media to the shared property-images bucket", () => {
    expect(getBucketForPurpose("PROPERTY_PHOTO")).toBe(STORAGE_BUCKETS.PROPERTY_IMAGES);
    expect(getBucketForPurpose("PROPERTY_VIDEO")).toBe(STORAGE_BUCKETS.PROPERTY_IMAGES);
    expect(getBucketForPurpose("ROOM_PHOTO")).toBe(STORAGE_BUCKETS.PROPERTY_IMAGES);
    expect(getBucketForPurpose("ROOM_VIDEO")).toBe(STORAGE_BUCKETS.PROPERTY_IMAGES);
  });

  it("routes vehicle media to its own bucket", () => {
    expect(getBucketForPurpose("VEHICLE_PHOTO")).toBe(STORAGE_BUCKETS.VEHICLE_IMAGES);
    expect(getBucketForPurpose("VEHICLE_VIDEO")).toBe(STORAGE_BUCKETS.VEHICLE_IMAGES);
  });

  it("routes sensitive/unclassified uploads to the private partner-documents bucket", () => {
    expect(getBucketForPurpose("LEGAL_DOCUMENT")).toBe(STORAGE_BUCKETS.PARTNER_DOCUMENTS);
    expect(getBucketForPurpose("OTHER")).toBe(STORAGE_BUCKETS.PARTNER_DOCUMENTS);
  });
});

describe("isPublicBucket", () => {
  it("marks property/vehicle/avatar/promo buckets as public", () => {
    expect(isPublicBucket(STORAGE_BUCKETS.PROPERTY_IMAGES)).toBe(true);
    expect(isPublicBucket(STORAGE_BUCKETS.VEHICLE_IMAGES)).toBe(true);
    expect(isPublicBucket(STORAGE_BUCKETS.AVATARS)).toBe(true);
    expect(isPublicBucket(STORAGE_BUCKETS.PROMO_MATERIALS)).toBe(true);
  });

  it("marks the document buckets as private", () => {
    expect(isPublicBucket(STORAGE_BUCKETS.PARTNER_DOCUMENTS)).toBe(false);
    expect(isPublicBucket(STORAGE_BUCKETS.BOOKING_DOCUMENTS)).toBe(false);
  });

  it("every sensitive-purpose bucket is private (no LEGAL_DOCUMENT upload can ever resolve to a public bucket)", () => {
    expect(isPublicBucket(getBucketForPurpose("LEGAL_DOCUMENT"))).toBe(false);
  });
});
