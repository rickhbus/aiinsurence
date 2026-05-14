import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Health Quest RLS verification assets", () => {
  it("documents cross-user and public-read RLS checks", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/diagnostics/health-quest-rls-verification.sql"),
      "utf8",
    );

    expect(sql).toContain("user_a_cannot_read_user_b_daily_quests");
    expect(sql).toContain("user_a_cannot_read_user_b_xp_events");
    expect(sql).toContain("user_a_cannot_read_user_b_onboarding_profile");
    expect(sql).toContain("user_a_cannot_read_user_b_lesson_progress");
    expect(sql).toContain("user_a_cannot_read_user_b_doctor_missions");
    expect(sql).toContain("analytics_events_are_not_client_readable");
    expect(sql).toContain("lesson_tracks_public_readable");
    expect(sql).toContain("lesson_nodes_public_readable");
    expect(sql).toContain("quest_templates_public_readable");
  });
});
