import "server-only";
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import { isEmailConfigured, getEmailConfig } from "@/lib/env";

let cachedClient: Resend | null = null;

function getResendClient(): Resend {
  if (cachedClient) return cachedClient;
  const { apiKey } = getEmailConfig();
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

/**
 * Throws on any failure (missing config, Resend API-level error, network
 * error) — every caller in this file wraps its own call so a delivery
 * failure never crashes the triggering request; it just means the
 * notification/verification/reset email didn't go out this time.
 */
async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!isEmailConfigured()) {
    console.info(
      `[email:dev] Skipping send (no RESEND_API_KEY). To: ${params.to} | Subject: ${params.subject}\n${params.html}`
    );
    return;
  }

  const { from } = getEmailConfig();
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    // Resend's SDK returns { error } for API-level failures (invalid key,
    // rate limit, unverified domain) rather than throwing — surface it as a
    // thrown error so every call site's try/catch actually catches it.
    // `error.message` is Resend's own description, never our secret key.
    throw new Error(`Resend API error: ${error.message}`);
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  firstName: string;
  verifyUrl: string;
  locale: string;
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "Email" });
  await sendEmail({
    to: params.to,
    subject: t("verifySubject"),
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color:#1e3a5f;">${t("verifyHeading", { firstName: params.firstName })}</h1>
        <p>${t("verifyBody")}</p>
        <p><a href="${params.verifyUrl}" style="display:inline-block;padding:12px 24px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;">${t("verifyButton")}</a></p>
        <p>${t("verifyLinkPrefix", { url: params.verifyUrl })}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  firstName: string;
  resetUrl: string;
  locale: string;
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "Email" });
  await sendEmail({
    to: params.to,
    subject: t("resetSubject"),
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color:#1e3a5f;">${t("resetHeading")}</h1>
        <p>${t("resetBody", { firstName: params.firstName })}</p>
        <p><a href="${params.resetUrl}" style="display:inline-block;padding:12px 24px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;">${t("resetButton")}</a></p>
        <p>${t("resetLinkPrefix", { url: params.resetUrl })}</p>
        <p>${t("resetIgnoreNotice")}</p>
      </div>
    `,
  });
}

/** Generic transactional email for the platform's in-app Notification events (bookings, cancellations, payments, subscriptions, approvals, etc.) — one shared template rather than a bespoke one per event type. */
export async function sendNotificationEmail(params: {
  to: string;
  firstName: string;
  title: string;
  message: string;
  locale: string;
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "Email" });
  await sendEmail({
    to: params.to,
    subject: params.title,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color:#1e3a5f; font-size: 20px;">${params.title}</h1>
        <p>${t("notificationGreeting", { firstName: params.firstName })}</p>
        <p>${params.message}</p>
        <p style="color:#888; font-size: 12px;">${t("notificationFooter")}</p>
      </div>
    `,
  });
}
