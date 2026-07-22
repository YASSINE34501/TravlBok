import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { getMaintenanceTasks } from "@/domains/pms/queries";
import { Badge } from "@/components/ui/badge";
import { ReportMaintenanceForm } from "@/components/partner/report-maintenance-form";
import { ResolveMaintenanceButton } from "@/components/partner/resolve-maintenance-button";

export default async function MaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hotelId?: string }>;
}) {
  const { locale } = await params;
  const { hotelId: requestedHotelId } = await searchParams;
  const { organization } = await getPartnerContext(locale);

  const hotels = await prisma.hotel.findMany({
    where: { organizationId: organization.id, deletedAt: null },
  });
  const hotel = requestedHotelId ? hotels.find((h) => h.id === requestedHotelId) : hotels[0];
  if (!hotel) notFound();

  const [tasks, rooms] = await Promise.all([
    getMaintenanceTasks(hotel.id),
    prisma.roomInventory.findMany({ where: { hotelId: hotel.id }, orderBy: { unitNumber: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Maintenance — {hotel.name}</h1>

      <ReportMaintenanceForm
        locale={locale}
        organizationId={organization.id}
        hotelId={hotel.id}
        rooms={rooms.map((r) => ({ id: r.id, unitNumber: r.unitNumber }))}
      />

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {task.roomInventory ? `Room ${task.roomInventory.unitNumber} · ` : ""}
              {task.title} · <Badge variant="secondary">{task.priority}</Badge>
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={task.status === "COMPLETED" ? "default" : "secondary"}>
                {task.status}
              </Badge>
              {task.status !== "COMPLETED" && (
                <ResolveMaintenanceButton
                  locale={locale}
                  organizationId={organization.id}
                  taskId={task.id}
                />
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">No maintenance issues reported.</p>
        )}
      </div>
    </div>
  );
}
