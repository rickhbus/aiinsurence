import type { DailyCheckinRow } from "@/lib/health-data/types";
import type { DailyHealthSummary, HealthContext } from "@/lib/health-os/types";
import type { EnergyBattery } from "./types";

export function buildEnergyBattery({
  todaySummary,
  healthContext,
  dailyCheckins = [],
}: {
  todaySummary?: DailyHealthSummary | null;
  healthContext?: HealthContext | null;
  dailyCheckins?: DailyCheckinRow[];
}): EnergyBattery {
  const reasons: string[] = [];
  const dailyLog = healthContext?.dailyLog;
  const subjectiveEnergy = dailyLog?.energyScore;
  const sleepMinutes = dailyLog?.sleepMinutes ?? healthContext?.mobileHealthSummary?.sleepMinutes ?? null;
  const sleepQuality = dailyLog?.sleepQuality;
  const moodScore = dailyLog?.moodScore;
  const stressScore = dailyLog?.stressScore;
  const hasHealthSignals = Boolean(
    dailyLog ||
    (healthContext?.moodLogs?.length ?? 0) > 0 ||
    (healthContext?.hydrationLogs?.length ?? 0) > 0 ||
    (healthContext?.toiletLogs?.length ?? 0) > 0 ||
    (healthContext?.gymWorkouts?.length ?? 0) > 0 ||
    dailyCheckins.length > 0,
  );
  const summaryEnergy = hasHealthSignals ? todaySummary?.energyScore ?? 72 : 72;
  let score = summaryEnergy;

  if (typeof subjectiveEnergy === "number") {
    score = Math.min(score, subjectiveEnergy * 10);
  }

  if (typeof sleepMinutes === "number" && sleepMinutes < 360) {
    score -= 18;
    reasons.push("low_sleep");
  }

  if (typeof sleepQuality === "number" && sleepQuality <= 4) {
    score -= 14;
    reasons.push("poor_sleep_quality");
  }

  if (typeof moodScore === "number" && moodScore <= 3) {
    score -= 14;
    reasons.push("low_mood");
  }

  if (typeof stressScore === "number" && stressScore >= 8) {
    score -= 12;
    reasons.push("high_stress");
  }

  if (hasNotGoodCheckin(dailyCheckins)) {
    score -= 16;
    reasons.push("not_good_checkin");
  }

  if (hasPainOrDehydrationSignal(healthContext)) {
    score -= 16;
    reasons.push("body_caution_signal");
  }

  const normalized = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: normalized,
    label: normalized < 40 ? "low" : normalized < 70 ? "medium" : "high",
    recommendedIntensity:
      normalized < 35 ? "rest" : normalized < 55 ? "light" : normalized > 88 ? "challenge" : "normal",
    reasons: Array.from(new Set(reasons)),
  };
}

export function shouldUseRecoveryMode({
  todaySummary,
  healthContext,
  dailyCheckins = [],
  energyBattery,
}: {
  todaySummary?: DailyHealthSummary | null;
  healthContext?: HealthContext | null;
  dailyCheckins?: DailyCheckinRow[];
  energyBattery?: EnergyBattery;
}) {
  const battery = energyBattery ?? buildEnergyBattery({ todaySummary, healthContext, dailyCheckins });

  return (
    battery.recommendedIntensity === "rest" ||
    battery.recommendedIntensity === "light" ||
    battery.reasons.some((reason) =>
      ["not_good_checkin", "body_caution_signal", "low_mood", "poor_sleep_quality"].includes(reason),
    )
  );
}

function hasNotGoodCheckin(dailyCheckins: DailyCheckinRow[]) {
  return dailyCheckins.some((checkin) => {
    const metadata = checkin.metadata ?? {};

    return metadata.notFeelingWell === true || metadata.redFlagPrompted === true;
  });
}

function hasPainOrDehydrationSignal(healthContext?: HealthContext | null) {
  const toiletCaution = healthContext?.toiletLogs?.some((log) =>
    Boolean(log.painFlag || log.dehydrationConcern),
  );
  const gymPain = healthContext?.gymWorkouts?.some((workout) =>
    Boolean(workout.painFlag || (workout.sorenessAfter ?? 0) >= 8),
  );

  return Boolean(toiletCaution || gymPain);
}
