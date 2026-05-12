import { describe, expect, it } from "vitest";
import { canAccessFamilyScope, defaultFamilyShareScopes, normalizeFamilyShareScopes } from "./sharing";

describe("family sharing consent scopes", () => {
  it("defaults to minimal non-sensitive sharing scopes", () => {
    expect(normalizeFamilyShareScopes([])).toEqual(defaultFamilyShareScopes);
    expect(normalizeFamilyShareScopes(["unknown"])).toEqual(defaultFamilyShareScopes);
  });

  it("requires explicit scopes and honors revocation", () => {
    expect(
      canAccessFamilyScope({
        scopes: ["safety_status", "daily_checkin_completion"],
        scope: "safety_status",
      }),
    ).toBe(true);
    expect(
      canAccessFamilyScope({
        scopes: ["safety_status"],
        scope: "mood_summary",
      }),
    ).toBe(false);
    expect(
      canAccessFamilyScope({
        scopes: ["mood_summary"],
        revokedAt: new Date().toISOString(),
        scope: "mood_summary",
      }),
    ).toBe(false);
  });
});
