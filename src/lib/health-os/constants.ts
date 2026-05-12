import type { GymWorkoutContext } from "./types";

export const HEALTH_OS_DISCLAIMERS = [
  "這不是醫療診斷，也不是醫療、法律、保險、營養或訓練保證。",
  "如屬緊急情況，請立即致電 999 或前往急症室。",
  "生活狀態參考不應用於保險資格、定價、保障、索償或照護准入決定。",
];

export const NUTRITION_DISCLAIMER =
  "這是根據輸入作出的粗略估算，不是醫療營養診斷。若你正在處理疾病、懷孕、飲食失調、糖尿病或其他醫療情況，請諮詢合資格醫護人員。";

export const INSURANCE_EDUCATION_DISCLAIMER =
  "以下只屬保障類別和文件準備教育，不構成保險、法律或理賠建議，亦不保證承保、賠償或索償結果。";

export const EXERCISE_LIBRARY = [
  "Bench press",
  "Dumbbell bench press",
  "Push-up",
  "Shoulder press",
  "Lateral raise",
  "Triceps pushdown",
  "Squat",
  "Leg press",
  "Lunges",
  "Romanian deadlift",
  "Deadlift",
  "Leg curl",
  "Calf raise",
  "Pull-up",
  "Lat pulldown",
  "Seated row",
  "Barbell row",
  "Face pull",
  "Biceps curl",
  "Plank",
  "Dead bug",
  "Treadmill walk",
  "Treadmill run",
  "Bike",
  "Rowing machine",
  "Stair climber",
  "Mobility/stretching",
];

export type WorkoutTemplate = {
  name: string;
  goal: string;
  level: string;
  daysPerWeek: number;
  days: Array<{
    name: string;
    focus: string;
    exercises: string[];
  }>;
  safetyNote: string;
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    name: "Beginner Full Body 3 days/week",
    goal: "safe_beginner_plan",
    level: "beginner",
    daysPerWeek: 3,
    days: [
      {
        name: "Day A",
        focus: "Full body strength",
        exercises: ["Squat or leg press", "Chest press", "Seated row", "Shoulder press", "Plank"],
      },
      {
        name: "Day B",
        focus: "Hinge and pull",
        exercises: ["Romanian deadlift", "Lat pulldown", "Push-up", "Lunges", "Dead bug"],
      },
      {
        name: "Day C",
        focus: "Balanced full body",
        exercises: ["Leg press", "Dumbbell bench press", "Cable row", "Lateral raise", "Core"],
      },
    ],
    safetyNote: "Keep 1-3 reps in reserve and stop for chest pain, dizziness, severe breathlessness, or sharp pain.",
  },
  {
    name: "Push / Pull / Legs",
    goal: "strength_hypertrophy",
    level: "intermediate",
    daysPerWeek: 3,
    days: [
      { name: "Push", focus: "Chest, shoulders, triceps", exercises: ["Bench press", "Shoulder press", "Lateral raise", "Triceps pushdown"] },
      { name: "Pull", focus: "Back, biceps", exercises: ["Pull-up or lat pulldown", "Seated row", "Face pull", "Biceps curl"] },
      { name: "Legs", focus: "Quads, hamstrings, glutes, calves", exercises: ["Squat or leg press", "Romanian deadlift", "Leg curl", "Calf raise"] },
    ],
    safetyNote: "Add optional cardio or mobility only when recovery is adequate.",
  },
  {
    name: "Fat Loss",
    goal: "fat_loss",
    level: "beginner_intermediate",
    daysPerWeek: 5,
    days: [
      { name: "Strength 1", focus: "Full body", exercises: ["Leg press", "Dumbbell bench press", "Seated row", "Plank"] },
      { name: "Cardio 1", focus: "Easy cardio", exercises: ["Treadmill walk", "Bike"] },
      { name: "Strength 2", focus: "Full body", exercises: ["Romanian deadlift", "Push-up", "Lat pulldown", "Dead bug"] },
      { name: "Cardio 2", focus: "Steps and aerobic base", exercises: ["Treadmill walk", "Stair climber"] },
      { name: "Strength 3", focus: "Full body", exercises: ["Squat or leg press", "Shoulder press", "Barbell row", "Mobility/stretching"] },
    ],
    safetyNote: "Use protein awareness and steps; avoid extreme dieting language or unsafe restriction.",
  },
  {
    name: "Muscle Gain",
    goal: "muscle_gain",
    level: "intermediate",
    daysPerWeek: 4,
    days: [
      { name: "Upper 1", focus: "Push and pull", exercises: ["Bench press", "Seated row", "Shoulder press", "Biceps curl"] },
      { name: "Lower 1", focus: "Squat pattern", exercises: ["Squat", "Leg curl", "Calf raise", "Plank"] },
      { name: "Upper 2", focus: "Volume", exercises: ["Dumbbell bench press", "Lat pulldown", "Lateral raise", "Triceps pushdown"] },
      { name: "Lower 2", focus: "Hinge pattern", exercises: ["Romanian deadlift", "Leg press", "Lunges", "Dead bug"] },
    ],
    safetyNote: "Progress gradually, keep rest days, and avoid pushing through pain or poor recovery.",
  },
  {
    name: "Recovery / Mobility",
    goal: "recovery_mobility",
    level: "all_levels",
    daysPerWeek: 2,
    days: [
      { name: "Light recovery", focus: "Circulation", exercises: ["Light walking", "Mobility/stretching", "Breathing"] },
      { name: "Soft tissue optional", focus: "Relaxation", exercises: ["Stretching", "Foam rolling if available", "Massage gun if available"] },
    ],
    safetyNote: "This is not medical rehab. Persistent pain should be assessed by a qualified professional.",
  },
];

export const SMALL_ACTIONS = [
  "慢呼吸 2 分鐘 / 2-minute breathing",
  "飲水 / Drink water",
  "步行 5 分鐘 / 5-minute walk",
  "寫低一件擔心事 / Write one worry down",
  "找可信任的人傾一句 / Message a trusted person",
  "伸展肩頸 / Stretch shoulders and neck",
  "今日較後時間減少咖啡因 / Reduce caffeine later today",
  "提早睡覺提醒 / Early sleep reminder",
  "只揀一件最重要的小任務 / Choose one task only",
  "改做恢復型訓練 / Recovery workout instead of heavy workout",
];

export function workoutTemplateToDb(template: WorkoutTemplate) {
  return {
    name: template.name,
    goal: template.goal,
    level: template.level,
    days_per_week: template.daysPerWeek,
    template_json: {
      days: template.days,
      safetyNote: template.safetyNote,
    },
    is_system: true,
  };
}

export function estimateWorkoutVolume(workout: GymWorkoutContext) {
  return (workout.sets ?? []).reduce((total, set) => {
    const reps = set.completed === false ? 0 : set.reps ?? 0;
    const weight = set.weightKg ?? 0;
    return total + reps * weight;
  }, 0);
}
