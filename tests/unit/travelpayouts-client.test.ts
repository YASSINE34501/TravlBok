import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildAviasalesDeepLink } from "@/lib/travelpayouts/client";

describe("buildAviasalesDeepLink", () => {
  const originalToken = process.env.TRAVELPAYOUTS_API_TOKEN;
  const originalPartner = process.env.TRAVELPAYOUTS_PARTNER_ID;

  beforeEach(() => {
    process.env.TRAVELPAYOUTS_API_TOKEN = "test-token";
    process.env.TRAVELPAYOUTS_PARTNER_ID = "12345";
  });

  afterEach(() => {
    process.env.TRAVELPAYOUTS_API_TOKEN = originalToken;
    process.env.TRAVELPAYOUTS_PARTNER_ID = originalPartner;
  });

  it("prepends the Aviasales domain and appends the marker with '&' when the link already has a query string", () => {
    const link = buildAviasalesDeepLink("/search/CMN0608CDG1?t=abc123&search_date=26072026");
    expect(link).toBe(
      "https://www.aviasales.com/search/CMN0608CDG1?t=abc123&search_date=26072026&marker=12345"
    );
  });

  it("appends the marker with '?' when the link has no existing query string", () => {
    const link = buildAviasalesDeepLink("/search/CMN0608CDG1");
    expect(link).toBe("https://www.aviasales.com/search/CMN0608CDG1?marker=12345");
  });

  it("throws MissingEnvError when partner id is not configured", () => {
    delete process.env.TRAVELPAYOUTS_PARTNER_ID;
    expect(() => buildAviasalesDeepLink("/search/x")).toThrow(
      /Missing required environment variable/
    );
  });
});
