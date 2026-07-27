"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { previewHotelPriceAction } from "@/domains/reservations/preview";
import { createHotelReservationAction } from "@/domains/reservations/actions";
import { formatMoney } from "@/lib/currency/format";
import { convertAmount } from "@/lib/currency/convert";
import { useRouter } from "@/i18n/navigation";
import type { CurrencyCode } from "@/lib/currency/config";
import { PaymentMethodSelect, type PaymentProviderChoice } from "./payment-method-select";
import { BookingSteps } from "./booking-steps";

type Breakdown = {
  currency: CurrencyCode;
  basePriceAmount: number;
  taxAmount: number;
  feeAmount: number;
  discountAmount: number;
  totalAmount: number;
  nights?: number;
};

export function HotelBookingForm({
  locale,
  roomTypeId,
  minStay,
  refundable,
  displayCurrency,
  rates,
}: {
  locale: string;
  roomTypeId: string;
  minStay: number;
  refundable?: boolean;
  displayCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
}) {
  const t = useTranslations("Booking");
  const tSearch = useTranslations("Search");
  const tAuth = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checkInDate, setCheckInDate] = useState(searchParams.get("checkIn") ?? "");
  const [checkOutDate, setCheckOutDate] = useState(searchParams.get("checkOut") ?? "");
  const [quantity, setQuantity] = useState(1);
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

  function toDisplayCurrency(amount: number, fromCurrency: CurrencyCode) {
    return formatMoney(
      convertAmount(amount, fromCurrency, displayCurrency, rates),
      displayCurrency,
      locale
    );
  }

  async function handlePreview() {
    if (!checkInDate || !checkOutDate) {
      toast.error(tCommon("required"));
      return;
    }
    setIsPreviewing(true);
    try {
      const result = await previewHotelPriceAction({
        roomTypeId,
        checkInDate,
        checkOutDate,
        quantity,
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
      const result = await createHotelReservationAction(locale, {
        roomTypeId,
        checkInDate,
        checkOutDate,
        quantity,
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
    <div>
      <BookingSteps
        steps={[t("travelerDetails"), t("payment"), t("reviewAndConfirm")]}
        currentStep={!breakdown ? 1 : isBooking ? 3 : 2}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("travelerDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="check-in">{tSearch("checkIn")}</Label>
                  <Input
                    id="check-in"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="check-out">{tSearch("checkOut")}</Label>
                  <Input
                    id="check-out"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="max-w-32">
                <Label htmlFor="quantity">{tCommon("rooms")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1"
                />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("payment")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PaymentMethodSelect value={paymentProvider} onChange={setPaymentProvider} />
              <div>
                <Label htmlFor="coupon">{t("couponCode")}</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
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
        </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{t("reviewAndConfirm")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {breakdown && refundable && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="size-4 shrink-0" />
              {t("freeCancellationBanner")}
            </div>
          )}
          {breakdown ? (
            <>
              <Row label={t("basePrice")} value={toDisplayCurrency(breakdown.basePriceAmount, breakdown.currency)} />
              <Row label={t("taxes")} value={toDisplayCurrency(breakdown.taxAmount, breakdown.currency)} />
              <Row label={t("fees")} value={toDisplayCurrency(breakdown.feeAmount, breakdown.currency)} />
              {breakdown.discountAmount > 0 && (
                <Row
                  label={t("discount")}
                  value={`-${toDisplayCurrency(breakdown.discountAmount, breakdown.currency)}`}
                />
              )}
              <Separator />
              <Row
                label={t("total")}
                value={toDisplayCurrency(breakdown.totalAmount, breakdown.currency)}
                bold
              />
              {displayCurrency !== breakdown.currency && (
                <p className="text-xs text-muted-foreground">
                  {t("willBeChargedAmount", {
                    amount: formatMoney(breakdown.totalAmount, breakdown.currency, locale),
                  })}
                </p>
              )}
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
          <p className="text-xs text-muted-foreground">
            {t("minimumStayNights", { count: minStay })}
          </p>
        </CardContent>
      </Card>
      </div>
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
