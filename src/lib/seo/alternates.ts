import { locales } from "@/i18n/routing";
import { getAppUrl } from "@/lib/env";

/**
 * Builds `alternates.canonical` + `alternates.languages` for a page's
 * `generateMetadata`. `path` is locale-free and starts with `/` (or is
 * `""` for the homepage) — e.g. `buildLocaleAlternates("en", "/hotels")`.
 * Every locale in the app is real content (next-intl requires a full
 * translation for each), so `languages` always lists all of them — there
 * is no case here where a language variant doesn't exist.
 */
export function buildLocaleAlternates(locale: string, path: string) {
  const appUrl = getAppUrl();
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${appUrl}/${l}${path}`])
  );
  return {
    canonical: `${appUrl}/${locale}${path}`,
    languages,
  };
}
