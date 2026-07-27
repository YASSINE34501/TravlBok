"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { notifyUser, notifyOrganizationOwners } from "@/domains/notifications/service";

type ActionResult = { success: true } | { success: false; error: string };

const HOUSEKEEPING_ROLES = [
  ...ROLE_GROUPS.partnerOwners,
  "HOTEL_MANAGER",
  "HOUSEKEEPING_STAFF",
] as const;
const SUPERVISOR_ROLES = [...ROLE_GROUPS.partnerOwners, "HOTEL_MANAGER"] as const;

export async function assignHousekeepingTaskAction(
  locale: string,
  organizationId: string,
  taskId: string,
  input: { assignedToUserId?: string; priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" }
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [...SUPERVISOR_ROLES]);
  const task = await prisma.housekeepingTask.update({
    where: { id: taskId },
    data: {
      assignedToUserId: input.assignedToUserId,
      priority: input.priority,
    },
  });
  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "housekeeping.task.assign",
    entityType: "HousekeepingTask",
    entityId: taskId,
  });
  if (input.assignedToUserId) {
    await notifyUser({
      userId: input.assignedToUserId,
      type: "housekeeping_task_assigned",
      title: "New housekeeping task assigned",
      message: `You've been assigned a ${task.type.toLowerCase()} task${input.priority ? ` (${input.priority} priority)` : ""}.`,
      titleKey: "housekeepingTaskTitle",
      messageKey: "housekeepingTaskMessage",
      params: {
        taskType: task.type.toLowerCase(),
        priority: input.priority ? ` (${input.priority} priority)` : "",
      },
      metadata: { taskId },
      channels: ["IN_APP"],
    });
  }
  revalidatePath(`/${locale}/dashboard/pms/housekeeping`);
  return { success: true };
}

export async function startCleaningAction(
  locale: string,
  organizationId: string,
  taskId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [...HOUSEKEEPING_ROLES]);
  await prisma.$transaction(async (tx) => {
    const task = await tx.housekeepingTask.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    await tx.roomInventory.update({
      where: { id: task.roomInventoryId },
      data: { operationalStatus: "CLEANING" },
    });
  });
  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "housekeeping.task.start",
    entityType: "HousekeepingTask",
    entityId: taskId,
  });
  revalidatePath(`/${locale}/dashboard/pms/housekeeping`);
  return { success: true };
}

export async function completeCleaningAction(
  locale: string,
  organizationId: string,
  taskId: string,
  notes?: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [...HOUSEKEEPING_ROLES]);
  await prisma.housekeepingTask.update({
    where: { id: taskId },
    data: { status: "COMPLETED", completedAt: new Date(), notes: notes || undefined },
  });
  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "housekeeping.task.complete",
    entityType: "HousekeepingTask",
    entityId: taskId,
  });
  revalidatePath(`/${locale}/dashboard/pms/housekeeping`);
  return { success: true };
}

export async function requestInspectionAction(
  locale: string,
  organizationId: string,
  taskId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [...HOUSEKEEPING_ROLES]);
  const task = await prisma.housekeepingTask.update({
    where: { id: taskId },
    data: { status: "COMPLETED" },
  });
  await prisma.roomInventory.update({
    where: { id: task.roomInventoryId },
    data: { operationalStatus: "INSPECTED" },
  });
  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "housekeeping.task.request_inspection",
    entityType: "HousekeepingTask",
    entityId: taskId,
  });
  revalidatePath(`/${locale}/dashboard/pms/housekeeping`);
  return { success: true };
}

export async function inspectRoomAction(
  locale: string,
  organizationId: string,
  taskId: string,
  passed: boolean
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [...SUPERVISOR_ROLES]);

  const task = await prisma.housekeepingTask.update({
    where: { id: taskId },
    data: {
      status: passed ? "INSPECTED" : "REOPENED",
      inspectedByUserId: user.id,
      inspectedAt: new Date(),
    },
  });
  await prisma.roomInventory.update({
    where: { id: task.roomInventoryId },
    data: { operationalStatus: passed ? "READY" : "DIRTY" },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "housekeeping.task.inspect",
    entityType: "HousekeepingTask",
    entityId: taskId,
    metadata: { passed },
  });
  revalidatePath(`/${locale}/dashboard/pms/housekeeping`);
  return { success: true };
}

export async function reopenTaskAction(
  locale: string,
  organizationId: string,
  taskId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [...SUPERVISOR_ROLES]);
  await prisma.housekeepingTask.update({
    where: { id: taskId },
    data: { status: "REOPENED", completedAt: null, inspectedAt: null },
  });
  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "housekeeping.task.reopen",
    entityType: "HousekeepingTask",
    entityId: taskId,
  });
  revalidatePath(`/${locale}/dashboard/pms/housekeeping`);
  return { success: true };
}

// ---- Maintenance ----

export async function reportMaintenanceIssueAction(
  locale: string,
  organizationId: string,
  input: {
    hotelId: string;
    roomInventoryId?: string;
    title: string;
    description?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  }
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [...HOUSEKEEPING_ROLES]);

  await prisma.maintenanceTask.create({
    data: {
      hotelId: input.hotelId,
      roomInventoryId: input.roomInventoryId || null,
      reportedByUserId: user.id,
      title: input.title,
      description: input.description || null,
      priority: input.priority ?? "NORMAL",
    },
  });

  if (input.roomInventoryId) {
    await prisma.roomInventory.update({
      where: { id: input.roomInventoryId },
      data: { operationalStatus: "OUT_OF_SERVICE" },
    });
  }

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "maintenance.task.report",
    entityType: "MaintenanceTask",
  });
  await notifyOrganizationOwners(organizationId, {
    type: "maintenance_issue_reported",
    title: "Maintenance issue reported",
    message: `${input.title}${input.priority === "URGENT" ? " (URGENT)" : ""}`,
    titleKey: "maintenanceReportedTitle",
    messageKey: "maintenanceReportedMessage",
    params: { issueTitle: input.title, urgent: input.priority === "URGENT" ? " (URGENT)" : "" },
    channels: ["IN_APP"],
  });
  revalidatePath(`/${locale}/dashboard/pms/maintenance`);
  return { success: true };
}

export async function resolveMaintenanceIssueAction(
  locale: string,
  organizationId: string,
  taskId: string,
  resolutionNotes?: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, [...SUPERVISOR_ROLES]);

  const task = await prisma.maintenanceTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      resolvedAt: new Date(),
      resolvedByUserId: user.id,
      resolutionNotes: resolutionNotes || null,
    },
  });

  if (task.roomInventoryId) {
    await prisma.roomInventory.update({
      where: { id: task.roomInventoryId },
      data: { operationalStatus: "DIRTY" },
    });
  }

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "maintenance.task.resolve",
    entityType: "MaintenanceTask",
    entityId: taskId,
  });
  revalidatePath(`/${locale}/dashboard/pms/maintenance`);
  return { success: true };
}
