import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as familyAlertPost } from "@/app/api/family/alert/route";
import { canCaregiverReadFamilyAlert } from "@/lib/family/alerts";
import { buildDailyCheckInStatus } from "@/lib/family/check-in-status";
import { buildFamilyWeeklyReport, getWeekStart } from "@/lib/family/family-weekly-report";
import { normalizeUserMode } from "@/lib/family/user-mode";
import { seniorMode, simpleActionChoices, simpleModeBlockedTerms } from "@/lib/health-app/senior-mode";
import {
  getSimpleLifeTrackerPayload,
  getSimpleDailyCheckInPayload,
  saveSimpleModeAction,
} from "@/lib/health-app/simple-mode-persistence";
import { INSURANCE_APP_LIMITS } from "@/lib/health-os/constants";
import { buildWeeklyReport } from "@/lib/health-os/weekly-report";
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

    expect(simpleToday).toContain("今日做咗咩？");
    expect(simpleActionChoices.map((choice) => choice.label)).toEqual([
      "起身",
      "食咗",
      "飲咗水",
      "心情",
      "郁咗",
      "影相",
      "唔舒服",
      "去廁所",
    ]);
    expect(simpleToday).toContain("頭暈");
    expect(simpleToday).toContain("胸口痛");
    expect(simpleToday).toContain("如情況嚴重，請即刻打 999 或去急症室。");
    expect(simpleToday).toContain("CallFamilyButton");
    expect(simpleToday).toContain("PhotoJournalButton");
    expect(callFamilyButton).toContain("叫屋企人");
    expect(photoJournalButton).toContain("影相");
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

  it("routes simple mode quick saves through the canonical life tracker endpoint", async () => {
    const calls: Array<{ endpoint: string; payload: Record<string, unknown> }> = [];
    const result = await saveSimpleModeAction({
      action: "water",
      endpoint: "/api/hydration/log",
      payload: { waterMl: 250 },
      postJson: async (endpoint, payload) => {
        calls.push({ endpoint, payload });
        return endpoint === "/api/life-tracker/log";
      },
    });

    expect(result).toEqual({
      saved: true,
      detailSaved: true,
      checkInSaved: true,
    });
    expect(calls.map((call) => call.endpoint)).toEqual(["/api/life-tracker/log"]);
    expect(calls[0]?.payload).toMatchObject({
      action: "water",
      amount: 250,
      unit: "ml",
    });
  });

  it("does not map simple movement to fake gym or running detail", () => {
    const payload = getSimpleLifeTrackerPayload({
      action: "move",
      payload: { notes: "郁咗 / I moved" },
    });

    expect(payload).toMatchObject({
      action: "move",
      note: "郁咗 / I moved",
    });
    expect(JSON.stringify(payload)).not.toMatch(/gym|running|workout/i);
  });

  it("keeps simple mode quick check-ins high level", () => {
    expect(getSimpleDailyCheckInPayload("wake")).toMatchObject({
      checkin_type: "wake_up",
      label: "起身",
      metadata: {
        source: "simple_today",
      },
    });
    expect(getSimpleDailyCheckInPayload("sick")).toMatchObject({
      checkin_type: "health_review",
      label: "唔舒服",
      metadata: {
        source: "simple_today",
      },
    });
    expect(getSimpleDailyCheckInPayload("not-good")).toMatchObject({
      checkin_type: "health_review",
      label: "唔舒服",
      metadata: {
        notFeelingWell: true,
        source: "simple_today",
      },
    });
  });

  it("keeps weekly and insurance surfaces education-only", () => {
    const report = buildWeeklyReport([{ locale: "zh-Hant" }]);
    const reportText = [
      report.overview,
      report.nutritionEducation,
      report.supplementEducation,
      report.insuranceEducation.join(" "),
      report.familySummary,
    ].join(" ");
    const mvpPages = readFileSync(
      new URL("../components/health-os/mvp-pages.tsx", import.meta.url),
      "utf8",
    );

    expect(mvpPages).toContain("Weekly AI Plan / 每週簡單建議");
    expect(mvpPages).toContain("Insurance Preparation / 保險準備");
    expect(mvpPages).toContain("Education only. No advice, no guarantee.");
    expect(INSURANCE_APP_LIMITS).toBe("This app does not provide insurance advice, brokerage, underwriting, eligibility, pricing, coverage, reimbursement, or claim outcome decisions.");
    expect(report.supplementEducation).toContain("先考慮食物和生活習慣；如想食補充品，請先問醫生或藥劑師");
    expect(report.supplementEducation).toContain("Consider food and lifestyle first; ask a doctor or pharmacist before supplements.");
    expect(reportText).not.toMatch(/\byou need\b|\byou should buy\b|\brecommended policy\b|\bcovered\b|\beligible\b|\bclaim likely approved\b/i);
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
