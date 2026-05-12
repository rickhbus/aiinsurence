import type {
  DailyLogContext,
  GymWorkoutContext,
  HealthContext,
  LifestyleScores,
  MealContext,
  ToiletContext,
} from "./types";
import { detectGymSafetyFlags, detectToiletSafety, statusFromFlags } from "./safety";

export function calculateLifestyleScores(context: HealthContext): LifestyleScores {
  const daily = context.dailyLog ?? {};
  const latestWorkout = context.gymWorkouts?.[0];
  const latestToilet = context.toiletLogs?.[0];
  const meals = context.meals ?? [];
  const hydration = context.hydrationLogs ?? [];
  const safetyFlags = collectSafetyFlags(context);
  const safetyStatus = statusFromFlags(safetyFlags);

  return {
    energyScore: scoreEnergy(daily),
    recoveryScore: scoreRecovery(daily, latestWorkout),
    nutritionScore: scoreNutrition(meals, hydration),
    stressScore: scoreStress(daily, context.moodLogs?.[0]),
    movementScore: scoreMovement(context),
    digestiveScore: scoreDigestive(latestToilet, hydration),
    safetyStatus,
  };
}

export function scoreEnergy(daily: DailyLogContext) {
  const sleepMinutes = daily.sleepMinutes ?? 0;
  const sleepScore = sleepMinutes >= 420 ? 85 : sleepMinutes >= 360 ? 72 : sleepMinutes >= 300 ? 58 : 42;
  const sleepQuality = normalizeOneToTen(daily.sleepQuality, 6) * 10;
  const energy = normalizeOneToTen(daily.energyScore, 6) * 10;
  const mood = normalizeOneToTen(daily.moodScore, 6) * 8;
  const stressPenalty = normalizeOneToTen(daily.stressScore, 5) * 4;

  return clampScore(Math.round((sleepScore * 0.3) + (sleepQuality * 0.2) + (energy * 0.32) + (mood * 0.18) - stressPenalty));
}

export function scoreRecovery(daily: DailyLogContext, workout?: GymWorkoutContext | null) {
  const sleepMinutes = daily.sleepMinutes ?? workout?.sleepMinutes ?? 0;
  const sleepBase = sleepMinutes >= 420 ? 34 : sleepMinutes >= 360 ? 26 : sleepMinutes >= 300 ? 18 : 10;
  const soreness = normalizeOneToTen(workout?.sorenessAfter ?? workout?.sorenessBefore, 3);
  const intensity = normalizeOneToTen(workout?.intensity, 4);
  const painPenalty = workout?.painFlag || workout?.sets?.some((set) => set.painFlag) ? 24 : 0;

  return clampScore(Math.round(44 + sleepBase - soreness * 3 - intensity * 1.5 - painPenalty));
}

export function scoreNutrition(meals: MealContext[], hydration: Array<{ waterMl?: number | null; caffeineMg?: number | null; alcoholUnits?: number | null }>) {
  const protein = meals.reduce((total, meal) => total + (meal.proteinG ?? 0), 0);
  const fiber = meals.reduce((total, meal) => total + (meal.fiberG ?? 0), 0);
  const water = hydration.reduce((total, item) => total + (item.waterMl ?? 0), 0) + meals.reduce((total, meal) => total + (meal.waterMl ?? 0), 0);
  const alcohol = hydration.reduce((total, item) => total + (item.alcoholUnits ?? 0), 0) + meals.reduce((total, meal) => total + (meal.alcoholUnits ?? 0), 0);
  const flags = meals.filter((meal) => meal.highSugarFlag || meal.highSodiumFlag).length;
  const proteinScore = Math.min(28, protein / 3);
  const fiberScore = Math.min(22, fiber * 1.4);
  const waterScore = Math.min(24, water / 100);

  return clampScore(Math.round(35 + proteinScore + fiberScore + waterScore - flags * 8 - alcohol * 8));
}

export function scoreStress(daily: DailyLogContext, mood?: { stressScore?: number | null; moodScore?: number | null; emotionLabel?: string | null } | null) {
  const stress = normalizeOneToTen(mood?.stressScore ?? daily.stressScore, 5);
  const moodScore = normalizeOneToTen(mood?.moodScore ?? daily.moodScore, 6);
  const sleepPenalty = (daily.sleepMinutes ?? 420) < 360 ? 10 : 0;
  const emotionPenalty = /overwhelmed|urgent|angry|sad|stressed/iu.test(mood?.emotionLabel ?? "") ? 10 : 0;

  return clampScore(Math.round(100 - stress * 7 + moodScore * 2 - sleepPenalty - emotionPenalty));
}

export function scoreMovement(context: HealthContext) {
  const steps = context.mobileHealthSummary?.steps ?? 0;
  const workouts = context.gymWorkouts?.length ?? context.mobileHealthSummary?.workouts ?? 0;
  const duration = (context.gymWorkouts ?? []).reduce((total, workout) => total + (workout.durationMinutes ?? 0), 0);
  const stepScore = Math.min(38, steps / 220);
  const workoutScore = Math.min(34, workouts * 18);
  const durationScore = Math.min(18, duration / 6);

  return clampScore(Math.round(20 + stepScore + workoutScore + durationScore));
}

export function scoreDigestive(toilet: ToiletContext | null | undefined, hydration: Array<{ waterMl?: number | null }> = []) {
  const water = hydration.reduce((total, item) => total + (item.waterMl ?? 0), 0);
  const waterScore = Math.min(22, water / 110);
  const stoolType = toilet?.stoolType;
  const stoolScore = stoolType == null ? 18 : stoolType >= 3 && stoolType <= 5 ? 32 : stoolType === 2 || stoolType === 6 ? 20 : 10;
  const movementScore = toilet?.bowelMovement === false ? 12 : 22;
  const safetyPenalty = toilet ? detectToiletSafety(toilet).flags.length * 30 : 0;

  return clampScore(Math.round(30 + waterScore + stoolScore + movementScore - safetyPenalty));
}

export function collectSafetyFlags(context: HealthContext) {
  const flags = [...(context.safetyFlags ?? [])];

  for (const mood of context.moodLogs ?? []) {
    if (mood.safetyFlag) {
      flags.push(mood.safetyFlag);
    }
  }

  for (const workout of context.gymWorkouts ?? []) {
    const gymFlags = detectGymSafetyFlags(workout);
    flags.push(...gymFlags.emergencyFlags);
    if (gymFlags.movementPain) {
      flags.push("movement_pain_flag");
    }
  }

  for (const toilet of context.toiletLogs ?? []) {
    flags.push(...detectToiletSafety(toilet).flags);
  }

  return Array.from(new Set(flags.filter(Boolean)));
}

function normalizeOneToTen(value: number | null | undefined, fallback: number) {
  return Math.min(10, Math.max(1, value ?? fallback));
}

export function clampScore(value: number) {
  return Math.min(100, Math.max(0, value));
}
