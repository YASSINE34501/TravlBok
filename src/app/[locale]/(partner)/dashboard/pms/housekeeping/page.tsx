import { notFound } from "next/navigation";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { getHousekeepingTasks } from "@/domains/pms/queries";
import { Badge } from "@/components/ui/badge";
import { HousekeepingTaskActions } from "@/components/partner/housekeeping-task-actions";

export default async function HousekeepingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hotelId?: string }>;
}) {
  const { locale } = await params;
  const { hotelId: requestedHotelId } = await searchParams;
  const { organization, membership } = await getPartnerContext(locale);

  const hotels = await prisma.hotel.findMany({
    where: { organizationId: organization.id, deletedAt: null },
  });
  const hotel = requestedHotelId ? hotels.find((h) => h.id === requestedHotelId) : hotels[0];
  if (!hotel) notFound();

  const tasks = await getHousekeepingTasks(hotel.id);
  const canInspect = ["HOTEL_OWNER", "HOTEL_MANAGER"].includes(membership.role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Housekeeping — {hotel.name}</h1>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              Room {task.roomInventory.unitNumber} · {task.type} ·{" "}
              <Badge variant="secondary">{task.priority}</Badge>
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={task.status === "COMPLETED" || task.status === "INSPECTED" ? "default" : "secondary"}>
                {task.status}
              </Badge>
              <HousekeepingTaskActions
                locale={locale}
                organizationId={organization.id}
                taskId={task.id}
                status={task.status}
                canInspect={canInspect}
              />
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">No housekeeping tasks.</p>
        )}
      </div>
    </div>
  );
}
