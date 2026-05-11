import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/readiness", () => ({
  buildReadinessReport: vi.fn(),
}));

describe("/api/readiness", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 200 for ready structured readiness JSON", async () => {
    const { buildReadinessReport } = await import("@/lib/server/readiness");
    vi.mocked(buildReadinessReport).mockResolvedValue({
      status: "ready",
      requestId: "test-ready-id",
      timestamp: "2026-05-11T00:00:00.000Z",
      checks: [
        {
          name: "runtime_config",
          status: "pass",
          message: "ok",
        },
      ],
    });
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/readiness", {
        headers: { "x-request-id": "test-ready-id" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ready");
    expect(payload.checks).toHaveLength(1);
    expect(payload.requestId).toBe("test-ready-id");
  });

  it("returns non-200 for not_ready dependencies", async () => {
    const { buildReadinessReport } = await import("@/lib/server/readiness");
    vi.mocked(buildReadinessReport).mockResolvedValue({
      status: "not_ready",
      requestId: "test-not-ready-id",
      timestamp: "2026-05-11T00:00:00.000Z",
      checks: [
        {
          name: "runtime_config",
          status: "fail",
          message: "missing config",
        },
      ],
    });
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/readiness", {
        headers: { "x-request-id": "test-not-ready-id" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.status).toBe("not_ready");
    expect(payload.requestId).toBe("test-not-ready-id");
  });
});
