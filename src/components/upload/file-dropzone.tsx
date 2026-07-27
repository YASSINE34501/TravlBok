"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFileAction } from "@/lib/upload/actions";
import type { UploadPurpose } from "@/generated/prisma/client";

type UploadedItem = { id: string; url: string };

type Props = {
  locale: string;
  purpose: UploadPurpose;
  organizationId?: string | null;
  multiple?: boolean;
  accept?: string;
  value: UploadedItem[];
  onChange: (items: UploadedItem[]) => void;
  className?: string;
};

export function FileDropzone({
  locale,
  purpose,
  organizationId = null,
  multiple = false,
  accept = "image/jpeg,image/png,image/webp",
  value,
  onChange,
  className,
}: Props) {
  const t = useTranslations("Common");
  const tValidation = useTranslations("Validation");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setIsUploading(true);
      try {
        const selected = multiple ? Array.from(files) : [files[0]];
        const uploaded: UploadedItem[] = [];

        for (const file of selected) {
          const formData = new FormData();
          formData.set("file", file);
          const result = await uploadFileAction(
            locale,
            purpose,
            organizationId,
            formData
          );
          if (!result.success) {
            toast.error(tValidation.has(result.error) ? tValidation(result.error) : result.error);
            continue;
          }
          uploaded.push({ id: result.id, url: result.url });
        }

        onChange(multiple ? [...value, ...uploaded] : uploaded);
      } finally {
        setIsUploading(false);
      }
    },
    [locale, purpose, organizationId, multiple, value, onChange, tValidation]
  );

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input px-6 py-8 text-center transition-colors hover:border-primary/50",
          isDragging && "border-primary bg-primary/5"
        )}
      >
        {isUploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">{t("dragDropFile")}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </button>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((existing) => existing.id !== item.id))
                }
                className="absolute top-1 end-1 rounded-full bg-background/90 p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
