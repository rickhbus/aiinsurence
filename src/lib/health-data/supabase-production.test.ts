import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDir = join(process.cwd(), "supabase", "migrations");
const productionMigration = readFileSync(
  join(migrationDir, "004_production_readiness.sql"),
  "utf8",
);
const allMigrations = [
  "001_auth_memory.sql",
  "002_mvp_audit_tables.sql",
  "003_health_os_data_foundation.sql",
  "004_production_readiness.sql",
  "005_gbl_emotion_engine.sql",
  "006_mobile_health_sync.sql",
  "007_daily_checkins.sql",
]
  .map((migration) => readFileSync(join(migrationDir, migration), "utf8"))
  .join("\n");

const userOwnedTables = [
  "profiles",
  "user_preferences",
  "household_members",
  "conversation_sessions",
  "conversation_messages",
  "saved_recommendations",
  "consent_events",
  "triage_assessments",
  "department_recommendations",
  "insurance_profiles",
  "insurance_recommendations",
  "escalation_cases",
  "audit_logs",
  "health_memory",
  "running_logs",
  "gym_logs",
  "meals",
  "water_logs",
  "sleep_logs",
  "body_metrics",
  "goals",
  "daily_health_summaries",
  "weekly_health_summaries",
  "user_streaks",
  "user_goal_progress",
  "ai_daily_recommendations",
  "ai_usage_events",
  "symptom_checks",
  "insurance_notes",
  "analytics_events",
];

describe("Supabase production readiness migration", () => {
  it("runs after the foundation migrations in numeric order", () => {
    const migrations = [
      "001_auth_memory.sql",
      "002_mvp_audit_tables.sql",
      "003_health_os_data_foundation.sql",
      "004_production_readiness.sql",
      "005_gbl_emotion_engine.sql",
      "006_mobile_health_sync.sql",
      "007_daily_checkins.sql",
    ];

    for (const migration of migrations) {
      expect(() => readFileSync(join(migrationDir, migration), "utf8")).not.toThrow();
    }
  });

  it("covers every user-owned table with explicit own-row policy generation", () => {
    for (const table of userOwnedTables) {
      expect(productionMigration).toContain(
        `ensure_user_owned_table_ready('${table}'`,
      );
    }

    expect(productionMigration).toContain("for select to authenticated");
    expect(productionMigration).toContain("for insert to authenticated");
    expect(productionMigration).toContain("for update to authenticated");
    expect(productionMigration).toContain("for delete to authenticated");
    expect(productionMigration).toContain("revoke all on table public.%I from anon");
  });

  it("keeps stricter ownership and consent checks for linked rows", () => {
    expect(productionMigration).toContain("conversation_messages_insert_own");
    expect(productionMigration).toContain("from public.conversation_sessions s");
    expect(productionMigration).toContain("saved_recommendations_insert_own");
    expect(productionMigration).toContain("escalation_cases_insert_own");
    expect(productionMigration).toContain("consent_type = 'adviser_handoff'");
  });

  it("adds dashboard-scale indexes and summary table indexes", () => {
    expect(productionMigration).toContain(
      "daily_health_summaries_user_summary_date_idx",
    );
    expect(productionMigration).toContain(
      "weekly_health_summaries_user_week_start_date_idx",
    );
    expect(allMigrations).toContain("running_logs_user_created_idx");
    expect(allMigrations).toContain("goals_user_status_created_idx");
    expect(allMigrations).toContain("health_memory_user_category_idx");
  });

  it("adds AI.GBL and Emotion Engine tables with RLS, owner policies, and bounded indexes", () => {
    expect(allMigrations).toContain("create table if not exists public.gbl_cases");
    expect(allMigrations).toContain("create table if not exists public.gbl_analysis_results");
    expect(allMigrations).toContain("create table if not exists public.emotion_engine_results");
    expect(allMigrations).toContain("create table if not exists public.insurance_analyses");
    expect(allMigrations).toContain("create table if not exists public.analysis_jobs");
    expect(allMigrations).toContain("gbl_analysis_results_user_created_idx");
    expect(allMigrations).toContain("emotion_engine_results_user_urgency_idx");
    expect(allMigrations).toContain("gbl_cases_select_own");
    expect(allMigrations).toContain("emotion_engine_results_insert_own");
    expect(allMigrations).toContain("Do not use for diagnosis or insurance eligibility");
  });

  it("adds everyday daily check-ins with RLS and bounded dashboard indexes", () => {
    expect(allMigrations).toContain("create table if not exists public.daily_checkins");
    expect(allMigrations).toContain("daily_checkins_own_rows");
    expect(allMigrations).toContain("daily_checkins_user_created_idx");
    expect(allMigrations).toContain("daily_checkins_user_type_created_idx");
    expect(allMigrations).toContain("Not clinical data and not used for insurance eligibility");
  });
});
