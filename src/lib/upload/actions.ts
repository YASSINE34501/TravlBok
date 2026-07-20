"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { saveUploadedFile } from "@/lib/storage";
import { validateUploadedFile, getUploadRules } from "@/lib/upload/validation";
import type { UploadPurpose } from "@/generated/prisma/client";

type UploadResult =
  | { success: true; id: string; url: string }
  | { success: false; error: string };

export async function uploadFileAction(
  locale: string,
  purpose: UploadPurpose,
  organizationId: string | null,
  formData: FormData
): Promise<UploadResult> {
  const user = await requireUser(locale);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "required" };
  }

  const validation = validateUploadedFile(file, purpose);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const rules = getUploadRules(purpose);
  const stored = await saveUploadedFile(file, rules.folder);

  const record = await prisma.uploadedFile.create({
    data: {
      url: stored.url,
      key: stored.key,
      filename: stored.filename,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      purpose,
      organizationId,
      uploadedByUserId: user.id,
    },
  });

  return { success: true, id: record.id, url: record.url };
}
