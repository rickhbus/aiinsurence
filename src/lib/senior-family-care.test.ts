import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as familyAlertPost } from "@/app/api/family/alert/route";
import { canCaregiverReadFamilyAlert } from "@/lib/family/alerts";
import { buildDailyCheckInStatus } from "@/lib/family/check-in-status";
import { buildFamilyWeeklyReport, getWeekStart } from "@/lib/family/family-weekly-report";
import { normalizeUserMode } from "@/lib/family/user-mode";
import { seniorMode, simpleModeBlockedTerms } from "@/lib/health-app/senior-mode";
import {
  getSimpleDailyCheckInPayload,
  saveSimpleModeAction,
} from "@/lib/health-app/simple-mode-persistence";
import { canUseFeature } from "@/lib/payments/entitlement-client";
import { photoJournalRequiresConfirmation } from "@/lib/photo-journal";
import { buildReminderInsert, containsMedicationAdvice } from "@/lib/reminders";

describe("senior and family care product contracts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps Senior Mode on by default", () => {
    expect(seniorMode).toBe(true);
  });

  it("keeps SimpleToday senior actions visible and technical terms hidden", () => {
    const simpleToday = readFileSync(
      new URL("../components/simple-mode/simple-today.tsx", import.meta.url),
      "utf8",
    );
    const emergencyButton = readFileSync(
      new URL("../components/simple-mode/emergency-button.tsx", import.meta.url),
      "utf8",
    );
    const callFamilyButton = readFileSync(
      new URL("../components/family/call-family-button.tsx", import.meta.url),
      "utf8",
    );
    const photoJournalButton = readFileSync(
      new URL("../components/photo-journal/photo-journal-button.tsx", import.meta.url),
      "utf8",
    );

    expect(simpleToday).toContain("CallFamilyButton");
    expect(simpleToday).toContain("PhotoJournalButton");
    expect(callFamilyButton).toContain("叫屋企人");
    expect(photoJournalButton).toContain("影相記錄");
    expect(emergencyButton).toContain("緊急 999");
    for (const term of simpleModeBlockedTerms.filter((item) => item !== "Supabase" && item !== "score")) {
      expect(simpleToday).not.toContain(term);
    }
  });

  it("accepts only valid caregiver onboarding modes", () => {
    expect(normalizeUserMode("self")).toBe("self");
    expect(normalizeUserMode("parent")).toBe("parent");
    expect(normalizeUserMode("caregiver")).toBe("caregiver");
    expect(normalizeUserMode("admin")).toBeNull();
  });

  it("requires auth or configured Supabase before creating a family alert", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const response = await familyAlertPost(
      new Request("http://localhost/api/family/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertType: "check_in_help" }),
      }),
    );

    expect([401, 503]).toContain(response.status);
  });

  it("lets consented caregivers read alerts without public access", () => {
    expect(
      canCaregiverReadFamilyAlert({
        role: "caregiver",
        scopes: ["safety_status"],
      }),
    ).toBe(true);
    expect(
      canCaregiverReadFamilyAlert({
        role: "member",
        scopes: ["safety_status"],
      }),
    ).toBe(false);
    expect(
      canCaregiverReadFamilyAlert({
        role: "caregiver",
        scopes: ["safety_status"],
        revokedAt: new Date().toISOString(),
      }),
    ).toBe(false);
  });

  it("shows high-level daily check-in status without mood, meal, or toilet details", () => {
    const status = buildDailyCheckInStatus({
      now: new Date("2026-05-13T09:00:00.000Z"),
      checkins: [
        {
          checkin_type: "health_review",
          label: "唔舒服",
          note: "private detail",
          metadata: { notFeelingWell: true, moodScore: 2, meal: "congee", toilet: "private" },
          created_at: "2026-05-13T08:00:00.000Z",
        },
      ],
      alerts: [],
    });
    const visible = status.visibleLinesZh.join(" ");

    expect(visible).toContain("已 check-in");
    expect(visible).toContain("今日話唔舒服");
    expect(visible).not.toContain("moodScore");
    expect(visible).not.toContain("congee");
    expect(visible).not.toContain("toilet");
  });

  it("keeps simple mode saved when the protected daily check-in succeeds first", async () => {
    const calls: Array<{ endpoint: string; payload: Record<string, unknown> }> = [];
    const result = await saveSimpleModeAction({
      action: "water",
      endpoint: "/api/hydration/log",
      payload: { waterMl: 250 },
      postJson: async (endpoint, payload) => {
        calls.push({ endpoint, payload });
        return endpoint === "/api/daily/checkins";
      },
    });

    expect(result).toEqual({
      saved: true,
      detailSaved: false,
      checkInSaved: true,
    });
    expect(calls.map((call) => call.endpoint)).toEqual([
      "/api/hydration/log",
      "/api/daily/checkins",
    ]);
    expect(calls[1]?.payload).toMatchObject({
      checkin_type: "water",
      label: "飲咗水",
      metadata: { source: "simple_today" },
    });
  });

  it("keeps simple mode quick check-ins high level", () => {
    expect(getSimpleDailyCheckInPayload("not-good")).toMatchObject({
      checkin_type: "health_review",
      label: "唔舒服",
      metadata: {
        notFeelingWell: true,
        source: "simple_today",
      },
    });
  });

  it("includes Family Care and parent-care pricing copy", () => {
    const pricing = readFileSync(
      new URL("../components/business/pricing-cards.tsx", import.meta.url),
      "utf8",
    );

    expect(pricing).toContain("Family Care");
    expect(pricing).toContain("最適合照顧爸爸媽媽 / Best for caring for parents");
    expect(pricing).toContain("屋企人知道今日有冇 check-in");
  });

  it("does not provide dosage advice for medication reminders", () => {
    const reminder = buildReminderInsert({
      reminderType: "medication_instruction",
      timeOfDay: "08:00",
      medicationName: "User medicine",
      notes: "after breakfast",
    });

    expect(reminder.title_zh).toBe("提醒我按醫生/藥劑師指示服藥");
    expect(containsMedicationAdvice(reminder.notes ?? "")).toBe(false);
    expect(reminder.notes).toContain("不提供用藥份量");
  });

  it("keeps appointment planner away from diagnostic claims", () => {
    const planner = readFileSync(
      new URL("../components/doctor/appointment-planner.tsx", import.meta.url),
      "utf8",
    );

    expect(planner).toContain("準備覆診 / Prepare visit");
    expect(planner.toLowerCase()).not.toContain("diagnose");
  });

  it("never paywalls emergency guidance", () => {
    expect(
      canUseFeature(
        { status: "unknown", plan: null, features: {} },
        "emergencyGuidance",
      ),
    ).toMatchObject({ allowed: true, shouldShowUpgrade: false });
  });

  it("requires confirmation before photo journal save", () => {
    expect(photoJournalRequiresConfirmation).toBe(true);
    const route = readFileSync(
      new URL("../app/api/photo-journal/route.ts", import.meta.url),
      "utf8",
    );
    expect(route).toContain("saved: false");
    expect(route).toContain("confirmed_by_user: true");
  });

  it("hides family weekly report sensitive details without consent", () => {
    const report = buildFamilyWeeklyReport({
      weekStart: getWeekStart(new Date("2026-05-13T09:00:00.000Z")),
      checkins: [
        {
          checkin_type: "health_review",
          note: "private mood and toilet detail",
          metadata: { notFeelingWell: true },
          created_at: "2026-05-13T08:00:00.000Z",
        },
      ],
      alerts: [],
      appointments: [],
      canShareSensitiveDetails: false,
    });

    expect(report.notFeelingWellDays).toBe(1);
    expect(report.sensitiveDetails).toEqual([]);
  });
});
