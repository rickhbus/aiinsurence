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
    expect(sql).toContain("user_a_cannot_read_user_b_reward_wallet");
    expect(sql).toContain("user_a_cannot_read_user_b_reward_events");
    expect(sql).toContain("user_a_cannot_read_user_b_review_items");
    expect(sql).toContain("league_rows_are_not_global_readable");
    expect(sql).toContain("analytics_events_are_not_client_readable");
    expect(sql).toContain("lesson_tracks_public_readable");
    expect(sql).toContain("lesson_nodes_public_readable");
    expect(sql).toContain("quest_templates_public_readable");
    expect(sql).toContain("reward_claim_rpc_available_to_authenticated");
  });

  it("hardens reward claims, practice review upserts, and league select policies in the latest migration", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/027_health_quest_rls_rewards_practice_hardening.sql"),
      "utf8",
    );

    expect(sql).toContain("claim_health_quest_reward");
    expect(sql).toContain("health_quest_review_items_user_type_source_uidx");
    expect(sql).toContain("health_quest_league_memberships_read_same_week_league");
    expect(sql).toContain("can_read_health_quest_league_member");
    expect(sql).not.toMatch(/health_quest_league_memberships for select[\s\S]+using \(true\)/i);
  });
});
