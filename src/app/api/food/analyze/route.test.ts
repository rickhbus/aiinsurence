import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/server/persistence-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/persistence-auth")>(
    "@/lib/server/persistence-auth",
  );

  return {
    ...actual,
    getAuthenticatedSupabase: vi.fn(async () => ({
      ok: true,
      supabase: {},
      user: { id: "user-1" },
    })),
  };
});

describe("food photo analysis route", () => {
  it("rejects unsupported image types before analysis", async () => {
    const formData = new FormData();
    formData.set("image", new File([new Uint8Array([1, 2, 3])], "meal.gif", { type: "image/gif" }));

    const response = await POST(new Request("http://localhost/api/food/analyze", {
      method: "POST",
      body: formData,
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("只支援");
  });

  it("rejects images over the configured upload size", async () => {
    const formData = new FormData();
    formData.set(
      "image",
      new File([new Uint8Array((6 * 1024 * 1024) + 1)], "meal.png", { type: "image/png" }),
    );

    const response = await POST(new Request("http://localhost/api/food/analyze", {
      method: "POST",
      body: formData,
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("6MB");
  });
});
