import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Wrench } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { getMaintenanceTasks } from "@/domains/pms/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PMS_TASK_STATUS_TONE, TASK_PRIORITY_TONE } from "@/lib/status-tones";
import type { TaskStatus, TaskPriority } from "@/generated/prisma/client";
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
  const t = await getTranslations("Pms");
  const tTaskStatus = await getTranslations("PmsTaskStatus");
  const tPriority = await getTranslations("TaskPriority");

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
      <PageHeader title={t("maintenance")} description={hotel.name} />

      <DataTableShell title={t("reportIssue")}>
        <div className="p-4 sm:p-5">
          <ReportMaintenanceForm
            locale={locale}
            organizationId={organization.id}
            hotelId={hotel.id}
            rooms={rooms.map((r) => ({ id: r.id, unitNumber: r.unitNumber }))}
          />
        </div>
      </DataTableShell>

      <DataTableShell>
        {tasks.length === 0 ? (
          <EmptyState icon={Wrench} title={t("noMaintenanceIssues")} className="border-0 py-12" />
        ) : (
          <div className="divide-y">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {task.roomInventory ? `${task.roomInventory.unitNumber} · ` : ""}
                    {task.title}
                  </p>
                  <StatusBadge tone={TASK_PRIORITY_TONE[task.priority as TaskPriority]}>
                    {tPriority(task.priority)}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={PMS_TASK_STATUS_TONE[task.status as TaskStatus]}>
                    {tTaskStatus(task.status)}
                  </StatusBadge>
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
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
