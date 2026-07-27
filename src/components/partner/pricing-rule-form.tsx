"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPricingRuleAction } from "@/domains/dynamic-pricing/actions";
import { useRouter } from "@/i18n/navigation";
import type { PricingRuleInput } from "@/lib/validation/pricing-rule";

type Hotel = { id: string; name: string; roomTypes: { id: string; name: string }[] };

const FACTOR_ITEMS: Record<PricingRuleInput["factor"], string> = {
  SEASON: "Season (date range)",
  DAY_OF_WEEK: "Day of week",
  WEEKEND: "Weekend",
  HOLIDAY: "Holiday (date range)",
  SPECIAL_EVENT: "Special event (date range)",
  OCCUPANCY: "Occupancy rate",
  REMAINING_INVENTORY: "Remaining inventory",
  BOOKING_WINDOW: "Booking window (days before check-in)",
  LENGTH_OF_STAY: "Length of stay (nights)",
  DEMAND_LEVEL: "Demand level",
};

const THRESHOLD_FACTORS = new Set(["OCCUPANCY", "REMAINING_INVENTORY", "BOOKING_WINDOW", "LENGTH_OF_STAY"]);
const DATE_RANGE_FACTORS = new Set(["SEASON", "HOLIDAY", "SPECIAL_EVENT"]);

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PricingRuleForm({
  locale,
  organizationId,
  hotels,
}: {
  locale: string;
  organizationId: string;
  hotels: Hotel[];
}) {
  const router = useRouter();
  const t = useTranslations("Partner");
  const [hotelId, setHotelId] = useState(hotels[0]?.id ?? "");
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [factor, setFactor] = useState<PricingRuleInput["factor"]>("OCCUPANCY");
  const [comparisonOperator, setComparisonOperator] = useState<"GTE" | "LTE">("GTE");
  const [thresholdValue, setThresholdValue] = useState<string>("80");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [demandLevel, setDemandLevel] = useState<"LOW" | "MEDIUM" | "HIGH">("HIGH");
  const [adjustmentType, setAdjustmentType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [adjustmentValue, setAdjustmentValue] = useState("20");
  const [priority, setPriority] = useState("0");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentHotel = hotels.find((h) => h.id === hotelId);
  const hotelItems = Object.fromEntries(hotels.map((h) => [h.id, h.name]));
  const roomTypeItems = Object.fromEntries([
    ["", "All room types"],
    ...(currentHotel?.roomTypes.map((rt) => [rt.id, rt.name]) ?? []),
  ]);

  async function handleSubmit() {
    if (!hotelId || !name.trim()) return;
    setIsSubmitting(true);
    try {
      const input: PricingRuleInput = {
        hotelId,
        roomTypeId: roomTypeId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        factor,
        comparisonOperator: THRESHOLD_FACTORS.has(factor) ? comparisonOperator : undefined,
        thresholdValue: THRESHOLD_FACTORS.has(factor) ? Number(thresholdValue) : undefined,
        daysOfWeek: factor === "DAY_OF_WEEK" ? daysOfWeek : undefined,
        dateRangeStart: DATE_RANGE_FACTORS.has(factor) ? dateRangeStart : undefined,
        dateRangeEnd: DATE_RANGE_FACTORS.has(factor) ? dateRangeEnd : undefined,
        demandLevel: factor === "DEMAND_LEVEL" ? demandLevel : undefined,
        adjustmentType,
        adjustmentValue: Number(adjustmentValue),
        priority: Number(priority),
        requiresApproval,
      };

      const result = await createPricingRuleAction(locale, organizationId, input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("pricingRuleCreated"));
      setName("");
      setDescription("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          items={hotelItems}
          value={hotelId}
          onValueChange={(v) => {
            if (v) {
              setHotelId(v);
              setRoomTypeId("");
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hotels.map((hotel) => (
              <SelectItem key={hotel.id} value={hotel.id}>
                {hotel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={roomTypeItems} value={roomTypeId} onValueChange={(v) => setRoomTypeId(v ?? "")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All room types</SelectItem>
            {(currentHotel?.roomTypes ?? []).map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          items={FACTOR_ITEMS}
          value={factor}
          onValueChange={(v) => v && setFactor(v as PricingRuleInput["factor"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FACTOR_ITEMS).map(([code, label]) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {THRESHOLD_FACTORS.has(factor) && (
          <>
            <Select
              items={{ GTE: "at least (>=)", LTE: "at most (<=)" }}
              value={comparisonOperator}
              onValueChange={(v) => v && setComparisonOperator(v as "GTE" | "LTE")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GTE">at least (&gt;=)</SelectItem>
                <SelectItem value="LTE">at most (&lt;=)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Threshold"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
            />
          </>
        )}

        {factor === "DEMAND_LEVEL" && (
          <Select
            items={{ LOW: "Low", MEDIUM: "Medium", HIGH: "High" }}
            value={demandLevel}
            onValueChange={(v) => v && setDemandLevel(v as "LOW" | "MEDIUM" | "HIGH")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {factor === "DAY_OF_WEEK" && (
        <div className="flex flex-wrap gap-3">
          {WEEKDAY_LABELS.map((label, index) => (
            <label key={label} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={daysOfWeek.includes(index)}
                onCheckedChange={(checked) =>
                  setDaysOfWeek((prev) =>
                    checked === true ? [...prev, index] : prev.filter((d) => d !== index)
                  )
                }
              />
              {label}
            </label>
          ))}
        </div>
      )}

      {DATE_RANGE_FACTORS.has(factor) && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input type="date" value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} />
          <Input type="date" value={dateRangeEnd} onChange={(e) => setDateRangeEnd(e.target.value)} />
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          items={{ PERCENTAGE: "Percentage %", FIXED_AMOUNT: "Fixed amount" }}
          value={adjustmentType}
          onValueChange={(v) => v && setAdjustmentType(v as "PERCENTAGE" | "FIXED_AMOUNT")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERCENTAGE">Percentage %</SelectItem>
            <SelectItem value="FIXED_AMOUNT">Fixed amount</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Adjustment (negative = discount)"
          value={adjustmentValue}
          onChange={(e) => setAdjustmentValue(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Priority (lower runs first)"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={requiresApproval}
          onCheckedChange={(checked) => setRequiresApproval(checked === true)}
        />
        Requires manager approval before it takes effect
      </label>

      <Button disabled={isSubmitting || !hotelId || !name.trim()} onClick={handleSubmit}>
        Create rule
      </Button>
    </div>
  );
}
