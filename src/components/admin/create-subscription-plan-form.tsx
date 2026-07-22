"use client";

import { useState } from "react";
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
import { createSubscriptionPlanAction } from "@/domains/subscriptions/actions";
import { useRouter } from "@/i18n/navigation";

type Tier = "FREE" | "STARTER" | "PROFESSIONAL" | "BUSINESS" | "ENTERPRISE";

const TIER_ITEMS: Record<Tier, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  BUSINESS: "Business",
  ENTERPRISE: "Enterprise",
};

const FEATURE_FIELDS = [
  "featureAnalytics",
  "featurePms",
  "featureChannelManager",
  "featureDynamicPricing",
  "featureApiAccess",
  "featureAffiliateTools",
  "featurePrioritySupport",
  "featureCustomCommissionRates",
] as const;

export function CreateSubscriptionPlanForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [tier, setTier] = useState<Tier>("STARTER");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [annualPrice, setAnnualPrice] = useState("");
  const [trialDays, setTrialDays] = useState("0");
  const [maxProperties, setMaxProperties] = useState("");
  const [maxRoomsPerProperty, setMaxRoomsPerProperty] = useState("");
  const [maxVehicles, setMaxVehicles] = useState("");
  const [maxBranches, setMaxBranches] = useState("");
  const [maxStaff, setMaxStaff] = useState("");
  const [maxMonthlyBookings, setMaxMonthlyBookings] = useState("");
  const [features, setFeatures] = useState<Record<(typeof FEATURE_FIELDS)[number], boolean>>({
    featureAnalytics: false,
    featurePms: false,
    featureChannelManager: false,
    featureDynamicPricing: false,
    featureApiAccess: false,
    featureAffiliateTools: false,
    featurePrioritySupport: false,
    featureCustomCommissionRates: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toLimit(value: string): number | null {
    return value.trim() === "" ? null : Number(value);
  }

  async function handleSubmit() {
    if (!nameEn || !monthlyPrice || !annualPrice) return;
    setIsSubmitting(true);
    try {
      await createSubscriptionPlanAction(locale, {
        tier,
        nameEn,
        nameFr,
        nameAr,
        monthlyPrice: Number(monthlyPrice),
        annualPrice: Number(annualPrice),
        trialDays: Number(trialDays) || 0,
        maxProperties: toLimit(maxProperties),
        maxRoomsPerProperty: toLimit(maxRoomsPerProperty),
        maxVehicles: toLimit(maxVehicles),
        maxBranches: toLimit(maxBranches),
        maxStaff: toLimit(maxStaff),
        maxMonthlyBookings: toLimit(maxMonthlyBookings),
        ...features,
      });
      toast.success("Plan created");
      setNameEn("");
      setNameFr("");
      setNameAr("");
      setMonthlyPrice("");
      setAnnualPrice("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <Select items={TIER_ITEMS} value={tier} onValueChange={(v) => v && setTier(v as Tier)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TIER_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        <Input placeholder="Name (FR)" value={nameFr} onChange={(e) => setNameFr(e.target.value)} />
        <Input placeholder="Name (AR)" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          type="number"
          placeholder="Monthly price"
          value={monthlyPrice}
          onChange={(e) => setMonthlyPrice(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Annual price"
          value={annualPrice}
          onChange={(e) => setAnnualPrice(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Trial days"
          value={trialDays}
          onChange={(e) => setTrialDays(e.target.value)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          type="number"
          placeholder="Max properties (blank = unlimited)"
          value={maxProperties}
          onChange={(e) => setMaxProperties(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max rooms/property"
          value={maxRoomsPerProperty}
          onChange={(e) => setMaxRoomsPerProperty(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max vehicles"
          value={maxVehicles}
          onChange={(e) => setMaxVehicles(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max branches"
          value={maxBranches}
          onChange={(e) => setMaxBranches(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max staff"
          value={maxStaff}
          onChange={(e) => setMaxStaff(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max monthly bookings"
          value={maxMonthlyBookings}
          onChange={(e) => setMaxMonthlyBookings(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FEATURE_FIELDS.map((field) => (
          <label key={field} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={features[field]}
              onCheckedChange={(checked) =>
                setFeatures((prev) => ({ ...prev, [field]: checked === true }))
              }
            />
            {field.replace("feature", "")}
          </label>
        ))}
      </div>
      <Button disabled={isSubmitting} onClick={handleSubmit}>
        Create plan
      </Button>
    </div>
  );
}
