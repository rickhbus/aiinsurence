import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { unlockAchievementOnce } from "../achievements";
import { purchaseCosmetic } from "../cosmetics";
import { deriveEnergyHearts } from "../energy-hearts";
import { challengeCopy } from "../family-challenges";
import { gameCopy } from "../game-copy";
import { buildLeagueStandings, sanitizeLeagueMember } from "../leagues";
import { lessonTracks } from "../lesson-content";
import { shouldShowPlusUpsell } from "../plus-copy";
import { buildPracticeSessionEventKey, getDefaultPracticeItems, scheduleReviewFromLesson } from "../review-scheduler";
import { buildChestRewardEvent, getChestReward, shouldUnlockDailyChest } from "../rewards";
import { buildDailyQuestState, unlockQuests } from "../quest-engine";
import { soundAllowed } from "../sound";
import { getCompletionXp } from "../xp";
import { assertNotificationCopySafe, notificationCopy } from "../notification-copy";
import { containsInsuranceGuarantee } from "../insurance-mission";

describe("Daily Health Quest parity pass contracts", () => {
  it("selects the current Today path node and keeps later nodes locked", () => {
    const state = buildDailyQuestState({ localDate: "2026-05-14" });

    expect(state.quests[0].status).toBe("active");
    expect(state.quests.slice(1).some((quest) => quest.status === "locked")).toBe(true);
  });

  it("unlocks the next path node only after the tiny step before it is done", () => {
    const state = buildDailyQuestState({ localDate: "2026-05-14" });
    const [first, second] = state.quests;
    const locked = unlockQuests([{ ...first, status: "active" }, second]);
    const unlocked = unlockQuests([{ ...first, status: "done" }, second]);

    expect(locked[1].status).toBe("locked");
    expect(unlocked[1].status).toBe("active");
  });

  it("unlocks a chest after the daily minimum and makes chest rewards deterministic", () => {
    expect(shouldUnlockDailyChest({ requiredCompletedCount: 3, totalRequiredCount: 3, completedCount: 3 })).toBe(true);
    expect(getChestReward("2026-05-14", "user-1").gems).toBeGreaterThanOrEqual(1);
    expect(getChestReward("2026-05-14", "user-1").gems).toBeLessThanOrEqual(5);
  });

  it("builds idempotent gem events for duplicate chest opens", () => {
    const first = buildChestRewardEvent("2026-05-14", "user-1");
    const second = buildChestRewardEvent("2026-05-14", "user-2");

    expect(first.eventKey).toBe(second.eventKey);
    expect(first.source).toBe("chest_opened");
  });

  it("uses stable practice XP idempotency keys", () => {
    expect(buildPracticeSessionEventKey("user-1", "hydration_review", "2026-05-14")).toBe(
      buildPracticeSessionEventKey("user-1", "hydration_review", "2026-05-14"),
    );
  });

  it("maps low energy hearts to recovery-safe suggestions without punishment", () => {
    const energy = deriveEnergyHearts({
      battery: { score: 2, label: "low", recommendedIntensity: "rest", reasons: ["low_energy"] },
      mode: "normal",
    });

    expect(energy.hearts).toBe(1);
    expect(energy.recoverySuggested).toBe(true);
    expect(energy.note.en).toMatch(/Recovery counts/);
  });

  it("keeps safety mode out of XP, celebration, sound, and premium upsell loops", () => {
    const state = buildDailyQuestState({ localDate: "2026-05-14", safetyStatus: "urgent" });

    expect(getCompletionXp(state.quests[0])).toBe(0);
    expect(soundAllowed({ enabled: true, mode: "safety", sound: "quest_complete" })).toBe(false);
    expect(shouldShowPlusUpsell({ mode: "safety", safetyLevel: "urgent", moment: "weekly_review" })).toBe(false);
  });

  it("league standings contain XP-only privacy-safe fields", () => {
    const sanitized = sanitizeLeagueMember({
      user_id: "01234567-89ab-cdef-0123-456789abcdef",
      display_name: "Ricky 91234567",
      league_name: "Bronze",
      week_start: "2026-05-11",
      xp: 80,
    });
    const standings = buildLeagueStandings([
      { userId: "u1", displayName: "Health Player 0001", leagueName: "Bronze", weekStart: "2026-05-11", xp: 40 },
      sanitized,
    ]);

    expect(standings[0]).toMatchObject({ xp: 80, rank: 1 });
    expect(standings[0].userId).toBe("league-89abcdef");
    expect(standings[0].displayName).toBe("Health Player CDEF");
    expect(JSON.stringify(standings)).not.toMatch(/mood|symptom|food|weight|calorie|doctor|insurance|claim|policy/i);
    expect(JSON.stringify(standings)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|91234567/i);
  });

  it("lesson tree has lockable units with practice review and boss nodes", () => {
    expect(lessonTracks).toHaveLength(9);
    expect(lessonTracks.every((track) => track.lessons.some((lesson) => lesson.kind === "practice"))).toBe(true);
    expect(lessonTracks.every((track) => track.lessons.some((lesson) => lesson.kind === "review"))).toBe(true);
    expect(lessonTracks.every((track) => track.lessons.some((lesson) => lesson.kind === "boss"))).toBe(true);
  });

  it("schedules review seven days after lessons and exposes default due practice", () => {
    const scheduled = scheduleReviewFromLesson({
      userId: "user-1",
      lessonSlug: "water-energy",
      completedAt: "2026-05-14T00:00:00.000Z",
    });

    expect(scheduled.dueAt).toBe("2026-05-21T00:00:00.000Z");
    expect(getDefaultPracticeItems(new Date("2026-05-14T00:00:00.000Z"))).toHaveLength(3);
  });

  it("achievement unlocks are idempotent", () => {
    const first = unlockAchievementOnce([], "first-step");
    const second = unlockAchievementOnce(first.slugs, "first-step");

    expect(first.unlockedNow).toBe(true);
    expect(second.unlockedNow).toBe(false);
    expect(second.slugs).toEqual(["first-step"]);
  });

  it("cosmetic purchases spend gems once and cannot buy clinical access", () => {
    const cosmetic = { slug: "jade-trail", cosmeticType: "theme" as const, title: { zh: "翡翠路線", en: "Jade Trail" }, costGems: 20 };
    const result = purchaseCosmetic({ walletGems: 30, ownedSlugs: [], cosmetic });
    const duplicate = purchaseCosmetic({ walletGems: result.walletGems, ownedSlugs: result.ownedSlugs, cosmetic });

    expect(result).toMatchObject({ purchased: true, walletGems: 10 });
    expect(duplicate).toMatchObject({ purchased: false, reason: "already_owned", walletGems: 10 });
  });

  it("reduced motion disables sound-like celebratory feedback", () => {
    expect(soundAllowed({ enabled: true, reducedMotion: true, sound: "lesson_complete" })).toBe(false);
  });

  it("reminder copy remains private", () => {
    expect(Object.values(notificationCopy).every(assertNotificationCopySafe)).toBe(true);
  });

  it("insurance mission forbids eligibility, pricing, coverage, and claim guarantees", () => {
    expect(containsInsuranceGuarantee("you are covered")).toBe(true);
    expect(containsInsuranceGuarantee("claim will pass")).toBe(true);
  });

  it("doctor prep lessons stay non-diagnostic", () => {
    const doctorUnit = lessonTracks.find((track) => track.slug === "doctor-prep");

    expect(JSON.stringify(doctorUnit)).toMatch(/not diagnosis|不作診斷/);
    expect(JSON.stringify(doctorUnit)).not.toMatch(/choose medication|prescribe|diagnose disease/i);
  });

  it("family challenges aggregate only safe progress data", () => {
    expect(JSON.stringify(challengeCopy)).toMatch(/Share progress|分享進度/);
    expect(JSON.stringify(challengeCopy)).toMatch(/not mood text|without sharing private health details/i);
    expect(JSON.stringify(challengeCopy)).not.toMatch(/share raw|HKID|phone|claim|policy/i);
  });

  it("game copy does not include forbidden shame or insurance-outcome wording", () => {
    const copy = JSON.stringify(gameCopy);

    expect(copy).not.toMatch(/failed|unhealthy|lazy|bad patient|non-compliant|health score is poor|insurance score improved|you are covered|you will be approved/i);
  });

  it("does not ship copied brand strings, assets, or color constants in user-facing Health Quest source", () => {
    const source = readSource(join(process.cwd(), "src"));

    expect(source).not.toMatch(/\bDuolingo\b|\bDuo\b|\bowl\b|Super Duolingo|duolingoGreen/i);
  });
});

function readSource(root: string): string {
  return readdirSync(root)
    .flatMap((entry) => {
      const path = join(root, entry);
      const stat = statSync(path);

      if (stat.isDirectory()) {
        if (["__tests__", ".next", "node_modules"].includes(entry)) {
          return [];
        }

        return [readSource(path)];
      }

      if (!/\.(ts|tsx|css)$/.test(entry) || /\.test\.(ts|tsx)$/.test(entry)) {
        return [];
      }

      return [readFileSync(path, "utf8")];
    })
    .join("\n");
}
