"use client";

import { FileDropzone } from "@/components/upload/file-dropzone";
import { useRouter } from "@/i18n/navigation";

export function PromoMaterialsManager({
  locale,
  organizationId,
  existing,
}: {
  locale: string;
  organizationId: string;
  existing: { id: string; url: string }[];
}) {
  const router = useRouter();

  return (
    <FileDropzone
      locale={locale}
      purpose="PROMO_MATERIAL"
      organizationId={organizationId}
      multiple
      accept="image/jpeg,image/png,image/webp,video/mp4"
      value={existing}
      onChange={() => router.refresh()}
    />
  );
}
