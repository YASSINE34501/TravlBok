"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrganizationAccess, ROLE_GROUPS } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { organizationSchema, type OrganizationInput } from "@/lib/validation/organization";

type ActionResult = { success: true } | { success: false; error: string };

const OWNER_ROLES = [...ROLE_GROUPS.partnerOwners];

export async function updateOrganizationAction(
  locale: string,
  organizationId: string,
  input: OrganizationInput
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, OWNER_ROLES);

  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  const data = parsed.data;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      legalName: data.legalName,
      displayName: data.displayName,
      registrationNumber: data.registrationNumber || null,
      taxId: data.taxId || null,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      baseCurrency: data.baseCurrency,
    },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "organization.update",
    entityType: "Organization",
    entityId: organizationId,
  });

  revalidatePath(`/${locale}/dashboard/organization`);
  return { success: true };
}

export async function submitOrganizationForReviewAction(
  locale: string,
  organizationId: string
): Promise<ActionResult> {
  const user = await requireOrganizationAccess(locale, organizationId, OWNER_ROLES);

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  if (organization.verificationStatus === "APPROVED") {
    return { success: true };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { verificationStatus: "PENDING_REVIEW", submittedAt: new Date() },
  });

  await logAudit({
    actorUserId: user.id,
    organizationId,
    action: "organization.submit_for_review",
    entityType: "Organization",
    entityId: organizationId,
  });

  revalidatePath(`/${locale}/dashboard`);
  return { success: true };
}
