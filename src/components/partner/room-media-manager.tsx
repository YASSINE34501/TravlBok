"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { addRoomMediaAction, removeRoomMediaAction } from "@/domains/rooms/actions";

type MediaItem = { id: string; url: string };

export function RoomMediaManager({
  locale,
  organizationId,
  hotelId,
  roomId,
  media,
}: {
  locale: string;
  organizationId: string;
  hotelId: string;
  roomId: string;
  media: MediaItem[];
}) {
  const t = useTranslations("Partner");
  const [isPending, startTransition] = useTransition();

  function handleUpload(items: { id: string; url: string }[]) {
    const newest = items[items.length - 1];
    if (newest) {
      startTransition(async () => {
        await addRoomMediaAction(locale, organizationId, hotelId, roomId, newest.url);
      });
    }
  }

  function handleRemove(mediaId: string) {
    startTransition(async () => {
      await removeRoomMediaAction(locale, organizationId, hotelId, roomId, mediaId);
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">{t("photos")}</h3>
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(item.id)}
                className="absolute top-1 end-1 rounded-full bg-background/90 p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <FileDropzone
        locale={locale}
        purpose="ROOM_PHOTO"
        organizationId={organizationId}
        multiple
        value={[]}
        onChange={handleUpload}
      />
    </div>
  );
}
