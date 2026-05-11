import { describe, expect, it, vi } from "vitest";
import {
  logError,
  normalizeError,
  sanitizeLogMetadata,
} from "./logger";

describe("privacy-safe logger", () => {
  it("redacts sensitive metadata fields", () => {
    expect(
      sanitizeLogMetadata({
        route: "/api/symptom-routing",
        symptomText: "胸痛",
        policyText: "policy details",
        status: 500,
      }),
    ).toEqual({
      route: "/api/symptom-routing",
      symptomText: "[redacted]",
      policyText: "[redacted]",
      status: 500,
    });
  });

  it("redacts sensitive tokens and phone-like values even under neutral keys", () => {
    expect(
      sanitizeLogMetadata({
        route: "/api/test",
        status: "Bearer abc.def.ghi",
        fallback: "+852 9123 4567",
      }),
    ).toEqual({
      route: "/api/test",
      status: "[redacted]",
      fallback: "[redacted]",
    });
  });

  it("normalizes unknown errors safely", () => {
    expect(normalizeError(new Error("boom"))).toEqual({
      type: "Error",
      message: "boom",
    });
    expect(normalizeError({ unexpected: true })).toEqual({
      type: "UnknownError",
      message: "Unknown error",
    });
  });

  it("does not throw when console logging fails", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("console failed");
    });

    expect(() => logError("test", { route: "/api/test" })).not.toThrow();
    spy.mockRestore();
  });
});
