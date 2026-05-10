import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeIntake } from "@/lib/navigation-engine";
import { POST as escalationPost } from "./escalations/route";
import { POST as recommendationPost } from "./recommendations/save/route";
import { POST as sessionPost } from "./sessions/route";

describe("persistence route safety", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects invalid session payloads before touching Supabase", async () => {
    const response = await sessionPost(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("requires explicit consent before saving recommendations", async () => {
    const recommendation = analyzeIntake("medical", "皮膚痕咗兩個星期");
    const response = await recommendationPost(
      new Request("http://localhost/api/recommendations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation, consentGranted: false }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Explicit save consent is required.",
    });
  });

  it("rejects emergency recommendations from the memory-save flow", async () => {
    const recommendation = analyzeIntake("medical", "胸口痛，又氣促");
    const response = await recommendationPost(
      new Request("http://localhost/api/recommendations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation, consentGranted: true }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Emergency guidance is not saved from this flow.",
    });
  });

  it("fails closed when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const recommendation = analyzeIntake("insurance", "我自僱，想買醫療保險");
    const response = await sessionPost(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "我自僱，想買醫療保險",
          recommendation,
          consentGranted: true,
        }),
      }),
    );

    expect(response.status).toBe(503);
  });

  it("requires explicit handoff consent for escalations", async () => {
    const recommendation = analyzeIntake("insurance", "我想買醫療保險");
    const response = await escalationPost(
      new Request("http://localhost/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation, consentGranted: false }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Explicit handoff consent is required.",
    });
  });
});
