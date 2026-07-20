import { defaultLocale } from "@/i18n/routing";

type LocalizedRecord = Record<string, unknown> | null | undefined;

export function pickLocaleText(
  value: LocalizedRecord,
  locale: string,
  fallback = ""
): string {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  const direct = record[locale];
  if (typeof direct === "string" && direct.length > 0) return direct;
  const fallbackValue = record[defaultLocale];
  if (typeof fallbackValue === "string" && fallbackValue.length > 0) {
    return fallbackValue;
  }
  const firstString = Object.values(record).find(
    (entry): entry is string => typeof entry === "string" && entry.length > 0
  );
  return firstString ?? fallback;
}
