import { describe, it, expect, vi, afterEach } from "vitest";
import { generateTotpSecret, buildOtpAuthUrl, verifyTotpCode, generateBackupCodes } from "@/lib/auth/totp";

// Minimal local base32 encoder used only to build the RFC 6238 test fixture
// below (turning the RFC's well-known ASCII secret into the base32 string
// verifyTotpCode expects) — this is test-fixture setup, not a reimplementation
// of anything under test.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("generateTotpSecret / buildOtpAuthUrl", () => {
  it("generates a base32 secret and a well-formed otpauth:// URL", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThan(0);

    const url = buildOtpAuthUrl(secret, "owner@riad-demo.ma");
    expect(url.startsWith("otpauth://totp/")).toBe(true);
    expect(url).toContain(`secret=${secret}`);
    expect(url).toContain("issuer=TravlBok");
    expect(url).toContain("digits=6");
    expect(url).toContain("period=30");
  });

  it("generates distinct secrets each call", () => {
    expect(generateTotpSecret()).not.toBe(generateTotpSecret());
  });
});

describe("verifyTotpCode against the real RFC 6238 Appendix B test vectors", () => {
  // RFC 6238's own secret: the ASCII string "12345678901234567890" (SHA1 case
  // uses the first 20 bytes). The RFC publishes 8-digit codes; the last 6
  // digits of an 8-digit dynamic-truncation code are mathematically identical
  // to this app's 6-digit code (`x % 10^8` truncated to `% 10^6` is the same
  // value as computing `% 10^6` directly), so truncating the RFC's published
  // values to 6 digits gives valid expected values for this app's DIGITS=6 output.
  const rfcSecretBase32 = base32Encode(Buffer.from("12345678901234567890", "ascii"));

  const vectors: { unixSeconds: number; expected8Digit: string }[] = [
    { unixSeconds: 59, expected8Digit: "94287082" },
    { unixSeconds: 1111111109, expected8Digit: "07081804" },
    { unixSeconds: 1111111111, expected8Digit: "14050471" },
    { unixSeconds: 1234567890, expected8Digit: "89005924" },
    { unixSeconds: 2000000000, expected8Digit: "69279037" },
  ];

  for (const { unixSeconds, expected8Digit } of vectors) {
    const expected6Digit = expected8Digit.slice(-6);
    it(`matches the RFC 6238 vector at T=${unixSeconds} (code ${expected6Digit})`, () => {
      vi.useFakeTimers();
      vi.setSystemTime(unixSeconds * 1000);
      expect(verifyTotpCode(rfcSecretBase32, expected6Digit)).toBe(true);
      expect(verifyTotpCode(rfcSecretBase32, "000000")).toBe(false);
      vi.useRealTimers();
    });
  }

  it("rejects malformed codes outright (wrong length / non-numeric)", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, "12345")).toBe(false);
    expect(verifyTotpCode(secret, "1234567")).toBe(false);
    expect(verifyTotpCode(secret, "abcdef")).toBe(false);
  });

  it("tolerates one time-step of clock drift on either side, but not two", () => {
    // The RFC vector at T=59 falls in time step 1 (unix seconds [30, 60)).
    // A code for step 1 must still verify at step 0 or step 2 (±1 step of
    // drift) but not at step 3 (91s, two steps away).
    const code = "287082"; // last 6 digits of the T=59 vector, "94287082"

    vi.useFakeTimers();
    vi.setSystemTime(29 * 1000); // step 0
    expect(verifyTotpCode(rfcSecretBase32, code)).toBe(true);

    vi.setSystemTime(61 * 1000); // step 2
    expect(verifyTotpCode(rfcSecretBase32, code)).toBe(true);

    vi.setSystemTime(91 * 1000); // step 3 — outside the ±1 drift window
    expect(verifyTotpCode(rfcSecretBase32, code)).toBe(false);
    vi.useRealTimers();
  });
});

describe("generateBackupCodes", () => {
  it("generates the requested count of unique, non-empty codes", () => {
    const codes = generateBackupCodes(8);
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) {
      expect(code.length).toBeGreaterThan(0);
    }
  });
});
