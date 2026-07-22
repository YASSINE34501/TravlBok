"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";

export async function setUserLocaleAction(locale: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.user.update({ where: { id: user.id }, data: { locale } });
}
