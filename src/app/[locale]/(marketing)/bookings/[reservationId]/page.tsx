import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { formatMoney } from "@/lib/currency/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CancelBookingButton } from "@/components/booking/cancel-booking-button";
import { PrintInvoiceButton } from "@/components/booking/print-invoice-button";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; reservationId: string }>;
}) {
  const { locale, reservationId } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations("Booking");
  const tStatus = await getTranslations("BookingStatus");
  const tCommon = await getTranslations("Common");
  const tSearch = await getTranslations("Search");

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, customerUserId: user.id },
    include: {
      hotelLink: { include: { hotel: true } },
      carLink: { include: { vehicle: true } },
      roomItems: { include: { roomType: true } },
      organization: true,
    },
  });
  if (!reservation) notFound();

  const isCancellable =
    reservation.status === "PENDING" || reservation.status === "CONFIRMED";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8" id="invoice">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">{t("bookingConfirmed")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("bookingReference")}: {reservation.bookingReference}
          </p>
        </div>
        <Badge className="ms-auto" variant="secondary">
          {tStatus(reservation.status)}
        </Badge>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {reservation.type === "HOTEL"
              ? reservation.hotelLink?.hotel.name
              : `${reservation.carLink?.vehicle.brand} ${reservation.carLink?.vehicle.model}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {reservation.type === "HOTEL" ? (
            <>
              <Row label={tSearch("checkIn")} value={reservation.checkInDate?.toDateString() ?? ""} />
              <Row label={tSearch("checkOut")} value={reservation.checkOutDate?.toDateString() ?? ""} />
              {reservation.roomItems.map((item) => (
                <Row
                  key={item.id}
                  label={item.roomType.name}
                  value={`× ${item.quantity} · ${item.nights} ${tCommon("nights")}`}
                />
              ))}
            </>
          ) : (
            <>
              <Row label={tSearch("pickupDate")} value={reservation.pickupAt?.toLocaleString() ?? ""} />
              <Row label={tSearch("returnDate")} value={reservation.returnAt?.toLocaleString() ?? ""} />
              {reservation.pickupLocation && (
                <Row label={tSearch("pickupLocation")} value={reservation.pickupLocation} />
              )}
            </>
          )}

          <Separator />

          <Row
            label={t("basePrice")}
            value={formatMoney(reservation.basePriceAmount.toString(), reservation.currency, locale)}
          />
          {Number(reservation.taxAmount) > 0 && (
            <Row
              label={t("taxes")}
              value={formatMoney(reservation.taxAmount.toString(), reservation.currency, locale)}
            />
          )}
          {Number(reservation.feeAmount) > 0 && (
            <Row
              label={t("fees")}
              value={formatMoney(reservation.feeAmount.toString(), reservation.currency, locale)}
            />
          )}
          {Number(reservation.discountAmount) > 0 && (
            <Row
              label={t("discount")}
              value={`-${formatMoney(reservation.discountAmount.toString(), reservation.currency, locale)}`}
            />
          )}
          <Row
            label={t("commission")}
            value={formatMoney(reservation.commissionAmount.toString(), reservation.currency, locale)}
          />
          <Separator />
          <Row
            label={t("total")}
            value={formatMoney(reservation.totalAmount.toString(), reservation.currency, locale)}
            bold
          />
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3 print:hidden">
        <PrintInvoiceButton label={t("downloadInvoice")} />
        {isCancellable && (
          <CancelBookingButton
            locale={locale}
            reservationId={reservation.id}
            label={t("cancelBooking")}
          />
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground print:hidden">
        {tCommon("brand")} · {reservation.organization.displayName}
      </p>
    </main>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
