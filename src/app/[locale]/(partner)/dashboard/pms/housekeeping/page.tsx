import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { getHousekeepingTasks } from "@/domains/pms/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PMS_TASK_STATUS_TONE, TASK_PRIORITY_TONE } from "@/lib/status-tones";
import type { TaskStatus, TaskPriority } from "@/generated/prisma/client";
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
  const t = await getTranslations("Pms");
  const tTaskStatus = await getTranslations("PmsTaskStatus");
  const tPriority = await getTranslations("TaskPriority");
  const tTaskType = await getTranslations("HousekeepingTaskType");

  const hotels = await prisma.hotel.findMany({
    where: { organizationId: organization.id, deletedAt: null },
  });
  const hotel = requestedHotelId ? hotels.find((h) => h.id === requestedHotelId) : hotels[0];
  if (!hotel) notFound();

  const tasks = await getHousekeepingTasks(hotel.id);
  const canInspect = ["HOTEL_OWNER", "HOTEL_MANAGER"].includes(membership.role);

  return (
    <div className="space-y-6">
      <PageHeader title={t("housekeeping")} description={hotel.name} />

      <DataTableShell>
        {tasks.length === 0 ? (
          <EmptyState icon={Sparkles} title={t("noHousekeepingTasks")} className="border-0 py-12" />
        ) : (
          <div className="divide-y">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{task.roomInventory.unitNumber}</p>
                  <p className="text-sm text-muted-foreground">{tTaskType(task.type)}</p>
                  <StatusBadge tone={TASK_PRIORITY_TONE[task.priority as TaskPriority]}>
                    {tPriority(task.priority)}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={PMS_TASK_STATUS_TONE[task.status as TaskStatus]}>
                    {tTaskStatus(task.status)}
                  </StatusBadge>
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
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
