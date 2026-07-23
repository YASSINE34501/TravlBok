"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  simulatePricingAction,
  recalculatePricingCalendarAction,
  getPriceHistoryAction,
  type SimulationNight,
  type PriceHistoryEntry,
} from "@/domains/dynamic-pricing/actions";

type RoomTypeOption = { id: string; hotelId: string; label: string };

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function PricingCalendarPanel({
  locale,
  organizationId,
  roomTypeOptions,
}: {
  locale: string;
  organizationId: string;
  roomTypeOptions: RoomTypeOption[];
}) {
  const [roomTypeId, setRoomTypeId] = useState(roomTypeOptions[0]?.id ?? "");
  const [startDate, setStartDate] = useState(todayPlus(0));
  const [endDate, setEndDate] = useState(todayPlus(7));
  const [isBusy, setIsBusy] = useState(false);
  const [rows, setRows] = useState<(SimulationNight | PriceHistoryEntry)[]>([]);
  const [mode, setMode] = useState<"simulation" | "calendar" | null>(null);

  const roomTypeItems = Object.fromEntries(roomTypeOptions.map((rt) => [rt.id, rt.label]));

  async function handleSimulate() {
    if (!roomTypeId) return;
    setIsBusy(true);
    try {
      const result = await simulatePricingAction(locale, organizationId, {
        roomTypeId,
        checkInDate: startDate,
        checkOutDate: endDate,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRows(result.nights);
      setMode("simulation");
      toast.success(
        `Occupancy ${result.occupancyRatePercent.toFixed(0)}% · ${result.remainingInventory} unit(s) remaining`
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRecalculate() {
    if (!roomTypeId) return;
    setIsBusy(true);
    try {
      const result = await recalculatePricingCalendarAction(locale, organizationId, {
        roomTypeId,
        startDate,
        endDate,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const history = await getPriceHistoryAction(locale, organizationId, {
        roomTypeId,
        startDate,
        endDate,
      });
      if (history.success) {
        setRows(history.entries);
        setMode("calendar");
      }
      toast.success("Pricing calendar recalculated");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <Select items={roomTypeItems} value={roomTypeId} onValueChange={(v) => v && setRoomTypeId(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roomTypeOptions.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={isBusy || !roomTypeId} onClick={handleSimulate}>
            Simulate
          </Button>
          <Button size="sm" disabled={isBusy || !roomTypeId} onClick={handleRecalculate}>
            Recalculate calendar
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <strong>Simulate</strong> previews the engine&apos;s output for a hypothetical stay without
        saving anything. <strong>Recalculate calendar</strong> persists a price-history row for
        every night in the range (using real per-day occupancy) — this is the bulk-update /
        forecast data source.
      </p>

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Base price</th>
                <th className="px-3 py-2">Final price</th>
                <th className="px-3 py-2">Rules applied</th>
                {mode === "calendar" && <th className="px-3 py-2">Source</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date} className="border-t">
                  <td className="px-3 py-1.5">{row.date}</td>
                  <td className="px-3 py-1.5">{row.basePrice.toFixed(2)}</td>
                  <td
                    className={`px-3 py-1.5 ${row.finalPrice !== row.basePrice ? "font-medium text-primary" : ""}`}
                  >
                    {row.finalPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground">
                    {row.appliedRuleIds.length}
                  </td>
                  {mode === "calendar" && "source" in row && (
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{row.source}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
