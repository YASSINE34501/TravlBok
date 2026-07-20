"use server";

import { z } from "zod";
import { Resend } from "resend";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  message: z.string().trim().min(10).max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const supportEmail = process.env.EMAIL_FROM ?? "TravlBok <no-reply@travlbok.com>";

export async function submitContactMessageAction(
  input: ContactInput
): Promise<{ success: boolean }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false };
  }

  const { name, email, message } = parsed.data;

  if (!resend) {
    console.info(`[contact:dev] From: ${name} <${email}>\n${message}`);
    return { success: true };
  }

  await resend.emails.send({
    from: supportEmail,
    to: supportEmail,
    replyTo: email,
    subject: `New contact message from ${name}`,
    html: `<p><strong>${name}</strong> (${email}) wrote:</p><p>${message.replace(/\n/g, "<br/>")}</p>`,
  });

  return { success: true };
}
