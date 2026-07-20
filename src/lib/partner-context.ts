import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser, isPlatformStaff } from "@/lib/rbac";

export async function getPartnerContext(locale: string) {
  const user = await requireUser(locale);

  if (isPlatformStaff(user.role)) {
    redirect(`/${locale}/admin`);
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    include: { organization: true },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) {
    redirect(`/${locale}/unauthorized`);
  }

  return { user, membership, organization: membership.organization };
}
