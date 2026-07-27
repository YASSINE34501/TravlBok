import "server-only";

/** Thrown by the getters below when a required variable is missing — the message names exactly which ones, never a value. */
export class MissingEnvError extends Error {
  constructor(names: string[]) {
    super(`Missing required environment variable(s): ${names.join(", ")}`);
    this.name = "MissingEnvError";
  }
}

function requireVars<T extends string>(names: T[]): Record<T, string> {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) throw new MissingEnvError(missing);
  return Object.fromEntries(names.map((name) => [name, process.env[name] as string])) as Record<
    T,
    string
  >;
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Throws MissingEnvError if unset — call only after checking isSupabaseStorageConfigured(), or inside a try/catch. */
export function getSupabaseStorageConfig(): { url: string; serviceRoleKey: string } {
  const vars = requireVars(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const);
  return { url: vars.SUPABASE_URL, serviceRoleKey: vars.SUPABASE_SERVICE_ROLE_KEY };
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Throws MissingEnvError if unset. EMAIL_FROM has a sane built-in default and is never required. */
export function getEmailConfig(): { apiKey: string; from: string } {
  const vars = requireVars(["RESEND_API_KEY"] as const);
  return { apiKey: vars.RESEND_API_KEY, from: process.env.EMAIL_FROM ?? "TravlBok <no-reply@travlbok.com>" };
}

/** Throws MissingEnvError if unset — cron routes call this and return 401 on failure rather than crashing. */
export function getCronSecret(): string {
  return requireVars(["CRON_SECRET"] as const).CRON_SECRET;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
