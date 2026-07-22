"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validation/auth";
import type { OrganizationType, Role } from "@/generated/prisma/client";

type ActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const ORG_ROLE_TO_TYPE: Partial<Record<Role, OrganizationType>> = {
  HOTEL_OWNER: "HOTEL",
  CAR_RENTAL_OWNER: "CAR_RENTAL",
  TRAVEL_AGENCY: "TRAVEL_AGENCY",
  AFFILIATE_PARTNER: "AFFILIATE",
};

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function registerAction(
  locale: string,
  input: RegisterInput
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return {
      success: false,
      error: "emailAlreadyUsed",
      fieldErrors: { email: "emailAlreadyUsed" },
    };
  }

  const passwordHash = await hashPassword(data.password);
  const orgType = ORG_ROLE_TO_TYPE[data.role];
  const freePlan =
    orgType && orgType !== "AFFILIATE"
      ? await prisma.subscriptionPlan.findFirst({ where: { tier: "FREE", isArchived: false } })
      : null;

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role: data.role,
        locale,
      },
    });

    if (orgType) {
      const organization = await tx.organization.create({
        data: {
          type: orgType,
          legalName: data.organizationName || `${data.firstName} ${data.lastName}`,
          displayName: data.organizationName || `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone || null,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: createdUser.id,
          role: data.role,
          status: "ACTIVE",
        },
      });

      if (freePlan) {
        const now = new Date();
        const farFuture = new Date(now);
        farFuture.setFullYear(farFuture.getFullYear() + 100);
        await tx.subscription.create({
          data: {
            organizationId: organization.id,
            planId: freePlan.id,
            status: "ACTIVE",
            billingInterval: "MONTHLY",
            currentPeriodStart: now,
            currentPeriodEnd: farFuture,
          },
        });
      }

      if (orgType === "AFFILIATE") {
        await tx.affiliate.create({
          data: {
            organizationId: organization.id,
            referralCode: generateReferralCode(),
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorUserId: createdUser.id,
        action: "user.register",
        entityType: "User",
        entityId: createdUser.id,
      },
    });

    return createdUser;
  });

  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail({
    to: user.email,
    firstName: user.firstName,
    verifyUrl: `${appUrl}/${locale}/verify-email?token=${token}`,
  });

  return { success: true };
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expires < new Date()) {
    return { success: false, error: "invalidOrExpiredToken" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date(), status: "ACTIVE" },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    }),
  ]);

  return { success: true };
}

export async function requestPasswordResetAction(
  locale: string,
  input: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Always return success to avoid leaking account existence.
  if (!user) {
    return { success: true };
  }

  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendPasswordResetEmail({
    to: user.email,
    firstName: user.firstName,
    resetUrl: `${appUrl}/${locale}/reset-password?token=${token}`,
  });

  return { success: true };
}

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.usedAt || record.expires < new Date()) {
    return { success: false, error: "invalidOrExpiredToken" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}

export async function resendVerificationAction(
  locale: string,
  email: string
): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) {
    return { success: true };
  }

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail({
    to: user.email,
    firstName: user.firstName,
    verifyUrl: `${appUrl}/${locale}/verify-email?token=${token}`,
  });

  return { success: true };
}
