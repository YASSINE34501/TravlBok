const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * True only for `http(s):` URLs. Blocks `javascript:`, `data:`, `vbscript:`,
 * `file:`, and any other scheme that a redirect target has no legitimate
 * reason to use — the class of input that turns a redirect endpoint into an
 * XSS or local-file-read vector.
 */
export function isSafeExternalRedirectUrl(url: URL): boolean {
  return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol);
}

/**
 * True only if `candidate` resolves to the same origin as `requestOrigin`.
 * Used to keep "internal" redirect params (e.g. `/r/[code]?to=`) from being
 * abused as an open redirect via an absolute URL or a protocol-relative
 * `//evil.com` — `new URL(absoluteOrProtocolRelative, base)` ignores `base`
 * entirely for those inputs, so this must be checked after construction,
 * not assumed from the input shape.
 */
export function isSameOriginUrl(candidate: URL, requestOrigin: string): boolean {
  return candidate.origin === requestOrigin;
}
