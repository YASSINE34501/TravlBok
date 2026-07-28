"use server";

import { z } from "zod";
import { sendContactMessageEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  message: z.string().trim().min(10).max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export async function submitContactMessageAction(
  input: ContactInput
): Promise<{ success: boolean }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false };
  }

  const { name, email, message } = parsed.data;

  try {
    await sendContactMessageEmail({ name, email, message });
  } catch (error) {
    console.error("[contact] failed to send contact message email", error);
    return { success: false };
  }

  return { success: true };
}
