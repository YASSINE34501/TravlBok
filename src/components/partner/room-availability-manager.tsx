"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addSeasonalPriceAction,
  removeSeasonalPriceAction,
  addBlackoutDateAction,
  removeBlackoutDateAction,
} from "@/domains/rooms/actions";

type SeasonalPrice = {
  id: string;
  name: string | null;
  startDate: string;
  endDate: string;
  price: string;
};

type BlackoutDate = { id: string; date: string; reason: string | null };

export function RoomAvailabilityManager({
  locale,
  organizationId,
  hotelId,
  roomId,
  seasonalPrices,
  blackoutDates,
}: {
  locale: string;
  organizationId: string;
  hotelId: string;
  roomId: string;
  seasonalPrices: SeasonalPrice[];
  blackoutDates: BlackoutDate[];
}) {
  const t = useTranslations("Partner");
  const [isPending, startTransition] = useTransition();
  const [seasonName, setSeasonName] = useState("");
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");
  const [seasonPrice, setSeasonPrice] = useState("");
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutReason, setBlackoutReason] = useState("");

  function handleAddSeason() {
    if (!seasonStart || !seasonEnd || !seasonPrice) return;
    startTransition(async () => {
      const result = await addSeasonalPriceAction(locale, organizationId, hotelId, roomId, {
        name: seasonName,
        startDate: seasonStart,
        endDate: seasonEnd,
        price: Number(seasonPrice),
      });
      if (result.success) {
        toast.success(t("seasonAdded"));
        setSeasonName("");
        setSeasonStart("");
        setSeasonEnd("");
        setSeasonPrice("");
      }
    });
  }

  function handleAddBlackout() {
    if (!blackoutDate) return;
    startTransition(async () => {
      const result = await addBlackoutDateAction(locale, organizationId, hotelId, roomId, {
        date: blackoutDate,
        reason: blackoutReason,
      });
      if (result.success) {
        toast.success(t("blackoutDateAdded"));
        setBlackoutDate("");
        setBlackoutReason("");
      }
    });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("seasonalPricing")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {seasonalPrices.map((season) => (
            <div
              key={season.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {season.name ? `${season.name}: ` : ""}
                {season.startDate} → {season.endDate} · {season.price}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() =>
                    removeSeasonalPriceAction(
                      locale,
                      organizationId,
                      hotelId,
                      roomId,
                      season.id
                    )
                  )
                }
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder={t("seasonNamePlaceholder")}
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              className="col-span-2"
            />
            <div>
              <Label className="text-xs">{t("seasonStart")}</Label>
              <Input
                type="date"
                value={seasonStart}
                onChange={(e) => setSeasonStart(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">{t("seasonEnd")}</Label>
              <Input
                type="date"
                value={seasonEnd}
                onChange={(e) => setSeasonEnd(e.target.value)}
              />
            </div>
            <Input
              type="number"
              placeholder={t("seasonPricePlaceholder")}
              value={seasonPrice}
              onChange={(e) => setSeasonPrice(e.target.value)}
              className="col-span-2"
            />
          </div>
          <Button size="sm" disabled={isPending} onClick={handleAddSeason}>
            {t("addSeason")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("blackoutDates")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {blackoutDates.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {entry.date} {entry.reason ? `· ${entry.reason}` : ""}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() =>
                    removeBlackoutDateAction(
                      locale,
                      organizationId,
                      hotelId,
                      roomId,
                      entry.id
                    )
                  )
                }
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={blackoutDate}
              onChange={(e) => setBlackoutDate(e.target.value)}
            />
            <Input
              placeholder={t("blackoutReasonPlaceholder")}
              value={blackoutReason}
              onChange={(e) => setBlackoutReason(e.target.value)}
            />
          </div>
          <Button size="sm" disabled={isPending} onClick={handleAddBlackout}>
            {t("addBlackoutDate")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
