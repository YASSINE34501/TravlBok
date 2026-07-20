import { getTranslations } from "next-intl/server";
import { Building2, Car, CalendarCheck } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function PartnerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const [propertyCount, vehicleCount, bookingCount] = await Promise.all([
    organization.type === "HOTEL"
      ? prisma.hotel.count({ where: { organizationId: organization.id, deletedAt: null } })
      : Promise.resolve(0),
    organization.type === "CAR_RENTAL"
      ? prisma.vehicle.count({ where: { organizationId: organization.id, deletedAt: null } })
      : Promise.resolve(0),
    prisma.reservation.count({ where: { organizationId: organization.id } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {organization.type === "HOTEL" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("properties")}
              </CardTitle>
              <Building2 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {propertyCount}
            </CardContent>
          </Card>
        )}
        {organization.type === "CAR_RENTAL" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("vehicles")}
              </CardTitle>
              <Car className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {vehicleCount}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("bookings")}
            </CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {bookingCount}
          </CardContent>
        </Card>
      </div>

      {organization.verificationStatus !== "APPROVED" && (
        <Card className="border-accent">
          <CardContent className="py-6">
            <p className="font-medium">
              {t("orgStatusMessage", {
                status: organization.verificationStatus.toLowerCase().replace("_", " "),
              })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("orgStatusDescription")}
            </p>
            <Button className="mt-4" render={<Link href="/dashboard/organization" />}>
              {t("completeProfile")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
