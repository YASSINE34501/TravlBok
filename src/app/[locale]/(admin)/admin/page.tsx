import { getTranslations } from "next-intl/server";
import {
  Users,
  Building2,
  BedDouble,
  Car,
  CalendarCheck,
  DollarSign,
  Clock,
  Ban,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin");

  const [
    totalUsers,
    totalPartners,
    totalHotels,
    totalRooms,
    totalVehicles,
    totalReservations,
    pendingOrgApprovals,
    pendingHotelApprovals,
    pendingVehicleApprovals,
    suspendedAccounts,
    revenueAgg,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.hotel.count({ where: { deletedAt: null } }),
    prisma.roomType.count({ where: { deletedAt: null } }),
    prisma.vehicle.count({ where: { deletedAt: null } }),
    prisma.reservation.count(),
    prisma.organization.count({ where: { verificationStatus: "PENDING_REVIEW" } }),
    prisma.hotel.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.vehicle.count({ where: { approvalStatus: "PENDING_REVIEW" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.reservation.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      _sum: { totalAmount: true, commissionAmount: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const stats = [
    { label: t("totalUsers"), value: totalUsers, icon: Users },
    { label: t("totalPartners"), value: totalPartners, icon: Building2 },
    { label: t("totalHotels"), value: totalHotels, icon: BedDouble },
    { label: t("totalRooms"), value: totalRooms, icon: BedDouble },
    { label: t("totalVehicles"), value: totalVehicles, icon: Car },
    { label: t("totalReservations"), value: totalReservations, icon: CalendarCheck },
    {
      label: t("totalRevenue"),
      value: `${(revenueAgg._sum.totalAmount ?? 0).toString()} MAD`,
      icon: DollarSign,
    },
    {
      label: t("pendingApprovals"),
      value: pendingOrgApprovals + pendingHotelApprovals + pendingVehicleApprovals,
      icon: Clock,
    },
    { label: t("suspendedAccounts"), value: suspendedAccounts, icon: Ban },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-xl font-semibold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("latestActivity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentAuditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-sm">
              <span>
                {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System"} ·{" "}
                {log.action}
              </span>
              <span className="text-muted-foreground">
                {log.createdAt.toLocaleString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
