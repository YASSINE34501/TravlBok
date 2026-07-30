import { isSafeExternalRedirectUrl, isSameOriginUrl } from "./validation";

/**
 * Parses and validates a redirect target meant to leave TravlBok (affiliate
 * / distribution-partner offers). Returns `null` for anything unparseable
 * or using an unsafe protocol — callers should fall back to an internal
 * page rather than redirect at all in that case. This is intentionally
 * permissive about *host* (the whole point of `/go/[vertical]` is sending
 * visitors to third-party provider domains that aren't known in advance)
 * but strict about *protocol*.
 */
export function resolveSafeExternalRedirect(rawUrl: string | null): URL | null {
  if (!rawUrl) return null;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  return isSafeExternalRedirectUrl(url) ? url : null;
}

/**
 * Resolves an "internal" redirect param (e.g. `/r/[code]?to=/hotels`)
 * against the current request, but only if the result stays on the same
 * origin — otherwise returns `fallbackPath`. Unlike
 * `resolveSafeExternalRedirect`, this path must never leave the site: it
 * backs referral-link landing pages, not offer redirects.
 */
export function resolveSafeInternalRedirect(
  rawPath: string | null | undefined,
  requestUrl: string,
  fallbackPath: string
): URL {
  const requestOrigin = new URL(requestUrl).origin;
  const fallback = new URL(fallbackPath, requestUrl);
  if (!rawPath) return fallback;

  let candidate: URL;
  try {
    candidate = new URL(rawPath, requestUrl);
  } catch {
    return fallback;
  }
  return isSameOriginUrl(candidate, requestOrigin) ? candidate : fallback;
}
