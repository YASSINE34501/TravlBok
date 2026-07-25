"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { previewCarPriceAction } from "@/domains/reservations/preview";
import { createCarReservationAction } from "@/domains/reservations/actions";
import { formatMoney } from "@/lib/currency/format";
import { useRouter } from "@/i18n/navigation";
import type { CurrencyCode } from "@/lib/currency/config";
import { PaymentMethodSelect, type PaymentProviderChoice } from "./payment-method-select";

type Breakdown = {
  currency: CurrencyCode;
  basePriceAmount: number;
  taxAmount: number;
  feeAmount: number;
  discountAmount: number;
  totalAmount: number;
  days?: number;
};

export function CarBookingForm({ locale, vehicleId }: { locale: string; vehicleId: string }) {
  const t = useTranslations("Booking");
  const tSearch = useTranslations("Search");
  const tAuth = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pickupAt, setPickupAt] = useState(searchParams.get("pickupDate") ?? "");
  const [returnAt, setReturnAt] = useState(searchParams.get("returnDate") ?? "");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [driverOptionRequested, setDriverOptionRequested] = useState(false);
  const [gpsRequested, setGpsRequested] = useState(false);
  const [childSeatRequested, setChildSeatRequested] = useState(false);
  const [airportDelivery, setAirportDelivery] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProviderChoice>(
    "CASH_AT_PROPERTY"
  );

  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  async function handlePreview() {
    if (!pickupAt || !returnAt) {
      toast.error(tCommon("required"));
      return;
    }
    setIsPreviewing(true);
    try {
      const result = await previewCarPriceAction({
        vehicleId,
        pickupAt,
        returnAt,
        couponCode: couponCode || undefined,
      });
      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        setBreakdown(null);
        return;
      }
      setBreakdown(result);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleConfirm() {
    if (!breakdown) return;
    setIsBooking(true);
    try {
      const result = await createCarReservationAction(locale, {
        vehicleId,
        pickupAt,
        returnAt,
        pickupLocation,
        dropoffLocation,
        driverOptionRequested,
        gpsRequested,
        childSeatRequested,
        airportDelivery,
        guestFirstName,
        guestLastName,
        guestEmail,
        guestPhone,
        specialRequests,
        couponCode,
        paymentProvider,
      });
      if (!result.success) {
        toast.error(tCommon("somethingWentWrong"));
        return;
      }
      router.push(`/bookings/${result.reservationId}`);
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>{t("travelerDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pickup-at">{tSearch("pickupDate")}</Label>
              <Input
                id="pickup-at"
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="return-at">{tSearch("returnDate")}</Label>
              <Input
                id="return-at"
                type="datetime-local"
                value={returnAt}
                onChange={(e) => setReturnAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pickup-location">{tSearch("pickupLocation")}</Label>
              <Input
                id="pickup-location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dropoff-location">{tSearch("dropoffLocation")}</Label>
              <Input
                id="dropoff-location"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={driverOptionRequested}
                onCheckedChange={(c) => setDriverOptionRequested(c === true)}
              />
              {t("driverOption")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={gpsRequested} onCheckedChange={(c) => setGpsRequested(c === true)} />
              {t("gpsOption")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={childSeatRequested}
                onCheckedChange={(c) => setChildSeatRequested(c === true)}
              />
              {t("childSeatOption")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={airportDelivery}
                onCheckedChange={(c) => setAirportDelivery(c === true)}
              />
              {tSearch("deliveryOption")}
            </label>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first-name">{tAuth("fullName")}</Label>
              <Input
                id="first-name"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="last-name">&nbsp;</Label>
              <Input
                id="last-name"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">{tAuth("email")}</Label>
              <Input
                id="email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">{tAuth("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="requests">{t("specialRequests")}</Label>
            <Textarea
              id="requests"
              rows={3}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="mt-1"
            />
          </div>
          <PaymentMethodSelect value={paymentProvider} onChange={setPaymentProvider} />
          <div>
            <Label htmlFor="coupon">{t("couponCode")}</Label>
            <div className="mt-1 flex gap-2">
              <Input id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <Button type="button" variant="outline" onClick={handlePreview} disabled={isPreviewing}>
                {isPreviewing ? tCommon("loading") : t("applyCoupon")}
              </Button>
            </div>
          </div>

          {!breakdown && (
            <Button onClick={handlePreview} disabled={isPreviewing} className="w-full">
              {isPreviewing ? tCommon("loading") : tCommon("viewDetails")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{t("priceBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {breakdown ? (
            <>
              <Row
                label={t("basePrice")}
                value={formatMoney(breakdown.basePriceAmount, breakdown.currency, locale)}
              />
              {breakdown.discountAmount > 0 && (
                <Row
                  label={t("discount")}
                  value={`-${formatMoney(breakdown.discountAmount, breakdown.currency, locale)}`}
                />
              )}
              <Separator />
              <Row
                label={t("total")}
                value={formatMoney(breakdown.totalAmount, breakdown.currency, locale)}
                bold
              />
              <Button
                className="w-full"
                disabled={isBooking || !guestFirstName || !guestLastName || !guestEmail}
                onClick={handleConfirm}
              >
                {isBooking ? tCommon("loading") : t("confirmBooking")}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("selectDatesPrompt", { action: tCommon("viewDetails") })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? "font-semibold text-base" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
