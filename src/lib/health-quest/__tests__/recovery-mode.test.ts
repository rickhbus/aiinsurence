import { describe, expect, it } from "vitest";
import type { DailyCheckinRow } from "@/lib/health-data/types";
import { buildDailyQuestState } from "../quest-engine";
import { buildEnergyBattery, shouldUseRecoveryMode } from "../recovery-mode";

describe("health quest recovery mode", () => {
  it("generates gentle quests for poor sleep or low energy", () => {
    const state = buildDailyQuestState({
      localDate: "2026-05-14",
      healthContext: {
        locale: "zh-Hant",
        dailyLog: {
          sleepMinutes: 240,
          sleepQuality: 3,
          energyScore: 2,
        },
      },
    });

    expect(state.mode).toBe("recovery");
    expect(state.quests.map((quest) => quest.type)).toEqual([
      "recovery",
      "water",
      "movement",
      "mood",
      "doctor_prep",
    ]);
    expect(state.coachNote.en).toContain("Recovery");
  });

  it("detects not-good check-ins without shaming the user", () => {
    const dailyCheckins: DailyCheckinRow[] = [
      {
        id: "c1",
        user_id: "u1",
        checkin_type: "health_review",
        label: "唔舒服",
        amount: null,
        unit: null,
        note: null,
        metadata: { notFeelingWell: true },
        created_at: "2026-05-14T01:00:00.000Z",
      },
    ];
    const battery = buildEnergyBattery({ dailyCheckins });

    expect(battery.reasons).toContain("not_good_checkin");
    expect(shouldUseRecoveryMode({ dailyCheckins, energyBattery: battery })).toBe(true);
  });
});
