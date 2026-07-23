"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pickLocaleText } from "@/lib/i18n/locale-text";

type Option = { id: string; label: string };

export function AnalyticsFilterForm({
  locale,
  countries,
  cities,
  organizations,
  hotels,
  subscriptionPlans,
}: {
  locale: string;
  countries: { id: string; name: unknown }[];
  cities: { id: string; name: unknown }[];
  organizations: { id: string; displayName: string }[];
  hotels: { id: string; name: string }[];
  subscriptionPlans: { id: string; tier: string; name: unknown }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");
  const [countryId, setCountryId] = useState(searchParams.get("countryId") ?? "");
  const [cityId, setCityId] = useState(searchParams.get("cityId") ?? "");
  const [organizationId, setOrganizationId] = useState(searchParams.get("organizationId") ?? "");
  const [hotelId, setHotelId] = useState(searchParams.get("hotelId") ?? "");
  const [serviceType, setServiceType] = useState(searchParams.get("serviceType") ?? "");
  const [currency, setCurrency] = useState(searchParams.get("currency") ?? "");
  const [subscriptionPlanId, setSubscriptionPlanId] = useState(
    searchParams.get("subscriptionPlanId") ?? ""
  );
  const [bookingStatus, setBookingStatus] = useState(searchParams.get("bookingStatus") ?? "");

  const countryOptions: Option[] = countries.map((c) => ({
    id: c.id,
    label: pickLocaleText(c.name as Record<string, unknown>, locale),
  }));
  const cityOptions: Option[] = cities.map((c) => ({
    id: c.id,
    label: pickLocaleText(c.name as Record<string, unknown>, locale),
  }));
  const planOptions: Option[] = subscriptionPlans.map((p) => ({
    id: p.id,
    label: pickLocaleText(p.name as Record<string, unknown>, locale) || p.tier,
  }));

  function toItems(options: Option[], everyLabel: string) {
    return Object.fromEntries([["", everyLabel], ...options.map((o) => [o.id, o.label])]);
  }

  function applyFilters() {
    const params = new URLSearchParams();
    const entries: [string, string][] = [
      ["dateFrom", dateFrom],
      ["dateTo", dateTo],
      ["countryId", countryId],
      ["cityId", cityId],
      ["organizationId", organizationId],
      ["hotelId", hotelId],
      ["serviceType", serviceType],
      ["currency", currency],
      ["subscriptionPlanId", subscriptionPlanId],
      ["bookingStatus", bookingStatus],
    ];
    for (const [key, value] of entries) {
      if (value) params.set(key, value);
    }
    router.push(`/admin/analytics?${params.toString()}`);
  }

  function resetFilters() {
    router.push("/admin/analytics");
  }

  return (
    <div className="grid gap-2 rounded-md border p-4 sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <label className="text-xs text-muted-foreground">From</label>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">To</label>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Country</label>
        <Select
          items={toItems(countryOptions, "Every country")}
          value={countryId}
          onValueChange={(v) => setCountryId(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Every country</SelectItem>
            {countryOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">City</label>
        <Select
          items={toItems(cityOptions, "Every city")}
          value={cityId}
          onValueChange={(v) => setCityId(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Every city</SelectItem>
            {cityOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Partner</label>
        <Select
          items={toItems(
            organizations.map((o) => ({ id: o.id, label: o.displayName })),
            "Every partner"
          )}
          value={organizationId}
          onValueChange={(v) => setOrganizationId(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Every partner</SelectItem>
            {organizations.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Property</label>
        <Select
          items={toItems(
            hotels.map((h) => ({ id: h.id, label: h.name })),
            "Every property"
          )}
          value={hotelId}
          onValueChange={(v) => setHotelId(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Every property</SelectItem>
            {hotels.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Service type</label>
        <Select
          items={{ "": "Every service", HOTEL: "Hotel", CAR: "Car rental" }}
          value={serviceType}
          onValueChange={(v) => setServiceType(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Every service</SelectItem>
            <SelectItem value="HOTEL">Hotel</SelectItem>
            <SelectItem value="CAR">Car rental</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Currency</label>
        <Select
          items={{ "": "Every currency", MAD: "MAD", EUR: "EUR", USD: "USD" }}
          value={currency}
          onValueChange={(v) => setCurrency(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Every currency</SelectItem>
            <SelectItem value="MAD">MAD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Subscription plan</label>
        <Select
          items={toItems(planOptions, "Every plan")}
          value={subscriptionPlanId}
          onValueChange={(v) => setSubscriptionPlanId(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Every plan</SelectItem>
            {planOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Booking status</label>
        <Select
          items={{
            "": "Every status",
            DRAFT: "Draft",
            PENDING: "Pending",
            CONFIRMED: "Confirmed",
            CANCELLED: "Cancelled",
            COMPLETED: "Completed",
            NO_SHOW: "No-show",
            REFUNDED: "Refunded",
            PARTIALLY_REFUNDED: "Partially refunded",
          }}
          value={bookingStatus}
          onValueChange={(v) => setBookingStatus(v ?? "")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Every status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="NO_SHOW">No-show</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="PARTIALLY_REFUNDED">Partially refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <Button size="sm" onClick={applyFilters}>
          Apply filters
        </Button>
        <Button size="sm" variant="outline" onClick={resetFilters}>
          Reset
        </Button>
      </div>
    </div>
  );
}
