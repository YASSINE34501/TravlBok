import type { NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTotpCode } from "@/lib/auth/totp";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { notifyUser } from "@/domains/notifications/service";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});

/** Thrown when a password is correct but the account has 2FA enabled and no (or a wrong) code was supplied — the client checks `result.code` to reveal the TOTP field and resubmit. */
class TwoFactorRequiredError extends CredentialsSignin {
  code = "two_factor_required";
}

class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

function getClientIp(request: Request | undefined): string {
  const forwarded = request?.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request?.headers.get("x-real-ip") ?? "unknown";
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA code", type: "text" },
      },
      authorize: async (rawCredentials, request) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { password, totpCode } = parsed.data;
        const email = parsed.data.email.toLowerCase();
        const ipAddress = getClientIp(request);
        const userAgent = request?.headers.get("user-agent") ?? null;

        // Rate limit both by email (protects one account from targeted
        // brute force) and by IP (protects against credential stuffing
        // across many accounts from one source).
        const [emailLimit, ipLimit] = await Promise.all([
          checkRateLimit(`login:email:${email}`, 5, 15 * 60 * 1000),
          checkRateLimit(`login:ip:${ipAddress}`, 20, 15 * 60 * 1000),
        ]);
        if (!emailLimit.allowed || !ipLimit.allowed) {
          throw new RateLimitedError();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.status === "SUSPENDED") return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          await logAudit({
            actorUserId: user.id,
            action: "auth.login_failed",
            entityType: "User",
            entityId: user.id,
            ipAddress,
            userAgent,
          });
          return null;
        }

        if (user.twoFactorEnabled) {
          if (!totpCode) throw new TwoFactorRequiredError();

          const validTotp = user.twoFactorSecret
            ? verifyTotpCode(user.twoFactorSecret, totpCode)
            : false;

          let matchedBackupCode: string | null = null;
          if (!validTotp) {
            for (const hashed of user.twoFactorBackupCodes) {
              if (await verifyPassword(totpCode, hashed)) {
                matchedBackupCode = hashed;
                break;
              }
            }
          }

          if (!validTotp && !matchedBackupCode) {
            await logAudit({
              actorUserId: user.id,
              action: "auth.login_failed_2fa",
              entityType: "User",
              entityId: user.id,
              ipAddress,
              userAgent,
            });
            throw new TwoFactorRequiredError();
          }

          if (matchedBackupCode) {
            // Backup codes are single-use — consume it immediately.
            await prisma.user.update({
              where: { id: user.id },
              data: {
                twoFactorBackupCodes: user.twoFactorBackupCodes.filter(
                  (code) => code !== matchedBackupCode
                ),
              },
            });
          }
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await logAudit({
          actorUserId: user.id,
          action: "auth.login",
          entityType: "User",
          entityId: user.id,
          ipAddress,
          userAgent,
        });

        // Login alert: notify the user if this IP hasn't appeared in their
        // last 10 successful logins (the row we just wrote is excluded via skip: 1).
        if (ipAddress !== "unknown") {
          const recentLogins = await prisma.auditLog.findMany({
            where: { actorUserId: user.id, action: "auth.login" },
            orderBy: { createdAt: "desc" },
            skip: 1,
            take: 10,
            select: { ipAddress: true },
          });
          const seenBefore = recentLogins.some((l) => l.ipAddress === ipAddress);
          if (!seenBefore) {
            await notifyUser({
              userId: user.id,
              type: "new_login_detected",
              title: "New login detected",
              message: `A new login to your TravlBok account was detected from IP address ${ipAddress}.`,
              titleKey: "newLoginTitle",
              messageKey: "newLoginMessage",
              params: { ip: ipAddress },
              metadata: { ipAddress, userAgent },
              channels: ["IN_APP", "EMAIL"],
            });
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.avatarUrl,
          role: user.role,
          locale: user.locale,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
        token.locale = user.locale as string;
        token.status = user.status as string;
        token.loginAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.locale = token.locale as string;
        session.user.status = token.status as string;
        session.user.loginAt = (token.loginAt as number | undefined) ?? 0;
      }
      return session;
    },
  },
};
