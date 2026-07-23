import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "TravlBok <no-reply@travlbok.com>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.info(
      `[email:dev] Skipping send (no RESEND_API_KEY). To: ${params.to} | Subject: ${params.subject}\n${params.html}`
    );
    return;
  }

  await resend.emails.send({
    from: emailFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  firstName: string;
  verifyUrl: string;
}) {
  await sendEmail({
    to: params.to,
    subject: "Verify your TravlBok email address",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color:#1e3a5f;">Welcome to TravlBok, ${params.firstName}</h1>
        <p>Please confirm your email address to activate your account.</p>
        <p><a href="${params.verifyUrl}" style="display:inline-block;padding:12px 24px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;">Verify email</a></p>
        <p>Or copy this link: ${params.verifyUrl}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  firstName: string;
  resetUrl: string;
}) {
  await sendEmail({
    to: params.to,
    subject: "Reset your TravlBok password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color:#1e3a5f;">Password reset</h1>
        <p>Hi ${params.firstName}, click below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${params.resetUrl}" style="display:inline-block;padding:12px 24px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;">Reset password</a></p>
        <p>Or copy this link: ${params.resetUrl}</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
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
}) {
  await sendEmail({
    to: params.to,
    subject: params.title,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color:#1e3a5f; font-size: 20px;">${params.title}</h1>
        <p>Hi ${params.firstName},</p>
        <p>${params.message}</p>
        <p style="color:#888; font-size: 12px;">You're receiving this because of activity on your TravlBok account.</p>
      </div>
    `,
  });
}
