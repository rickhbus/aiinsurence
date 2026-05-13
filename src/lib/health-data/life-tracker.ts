import { z } from "zod";
import { analyzeMood } from "@/lib/health-os/mood";
import { sanitizePhotoJournalText } from "@/lib/photo-journal";
import {
  assertUserId,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import { createDailyCheckin } from "./daily-checkins";
import { refreshAfterLogChange } from "./summary-refresh";
import type { DailyCheckinRow, TodayRecommendation } from "./types";
import {
  mealInputSchema,
  waterInputSchema,
  type DailyCheckinInput,
} from "./validation";

const optionalText = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

export const lifeTrackerActionSchema = z.enum([
  "wake",
  "toilet",
  "water",
  "meal",
  "move",
  "mood",
  "sick",
  "photo_text",
]);

export const lifeTrackerLogInputSchema = z.object({
  action: lifeTrackerActionSchema,
  occurredAt: z.string().datetime().optional(),
  note: optionalText(600),
  amount: z.coerce.number().min(0).max(100000).optional().nullable(),
  unit: z.literal("ml").optional(),
  details: z.record(z.string(), z.unknown()).optional().default({}),
});

export type LifeTrackerLogInput = z.infer<typeof lifeTrackerLogInputSchema>;

export type LifeTrackerDetail = {
  type: string;
  id: string;
};

export type LifeTrackerLogResult = {
  saved: boolean;
  checkin: DailyCheckinRow;
  detail?: LifeTrackerDetail;
  recommendation?: TodayRecommendation;
};

export async function saveLifeTrackerLog({
  supabase,
  userId,
  input,
  refreshSummaries = true,
}: {
  supabase: HealthDataClient;
  userId: string;
  input: LifeTrackerLogInput;
  refreshSummaries?: boolean;
}): Promise<LifeTrackerLogResult> {
  assertUserId(userId);
  const payload = lifeTrackerLogInputSchema.parse(input);
  const occurredAt = payload.occurredAt ?? new Date().toISOString();
  const checkin = await createDailyCheckin(
    supabase,
    userId,
    buildDailyCheckinInput(payload, occurredAt),
  );
  const detail = await saveLifeTrackerDetail({
    supabase,
    userId,
    input: payload,
    occurredAt,
    refreshSummaries,
  });

  return {
    saved: true,
    checkin,
    detail,
  };
}

function buildDailyCheckinInput(
  input: LifeTrackerLogInput,
  occurredAt: string,
): DailyCheckinInput {
  const config = getCheckinConfig(input);

  return {
    checkin_type: config.checkinType,
    label: config.label,
    amount: config.amount ?? null,
    unit: config.unit ?? null,
    note: input.note ?? null,
    created_at: occurredAt,
    metadata: {
      source: "life_tracker",
      action: input.action,
      rawPhotoStored: false,
      ...config.metadata,
    },
  };
}

function getCheckinConfig(input: LifeTrackerLogInput): {
  checkinType: DailyCheckinInput["checkin_type"];
  label: string;
  amount?: number | null;
  unit?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
} {
  const category = readString(input.details, "category");

  switch (input.action) {
    case "wake":
      return { checkinType: "wake_up", label: "起身" };
    case "water":
      return {
        checkinType: "water",
        label: "飲咗水",
        amount: getWaterAmountMl(input),
        unit: "ml",
      };
    case "meal":
      return { checkinType: "meal", label: "食咗" };
    case "photo_text":
      return {
        checkinType: isMealLikePhoto(input) ? "meal" : "health_review",
        label: isMealLikePhoto(input) ? "相片餐點" : "影相",
        metadata: { category },
      };
    case "move":
      return { checkinType: "exercise", label: "郁咗" };
    case "mood":
      return { checkinType: "health_review", label: "心情" };
    case "sick":
      return {
        checkinType: "health_review",
        label: "唔舒服",
        metadata: {
          notFeelingWell: true,
          redFlagPrompted: readBoolean(input.details, "redFlagPrompted") ?? false,
        },
      };
    case "toilet":
      return { checkinType: "health_review", label: "去廁所" };
  }
}

async function saveLifeTrackerDetail({
  supabase,
  userId,
  input,
  occurredAt,
  refreshSummaries,
}: {
  supabase: HealthDataClient;
  userId: string;
  input: LifeTrackerLogInput;
  occurredAt: string;
  refreshSummaries: boolean;
}) {
  switch (input.action) {
    case "wake":
      return upsertDailyHealthLog(supabase, userId, {
        log_date: occurredAt.slice(0, 10),
        wake_time: occurredAt,
      });
    case "water":
      return insertWaterLog(supabase, userId, input, occurredAt, refreshSummaries);
    case "meal":
      return insertMealLog(supabase, userId, input, occurredAt, refreshSummaries);
    case "photo_text":
      return isMealLikePhoto(input)
        ? insertMealLog(supabase, userId, input, occurredAt, refreshSummaries)
        : insertPhotoJournalEntry(supabase, userId, input);
    case "toilet":
      return insertToiletLog(supabase, userId, input, occurredAt);
    case "mood":
      return insertMoodLog(supabase, userId, input);
    case "sick":
      return upsertDailyHealthLog(supabase, userId, {
        log_date: occurredAt.slice(0, 10),
        body_notes: buildSickBodyNote(input),
      });
    case "move":
      return undefined;
  }
}

async function insertWaterLog(
  supabase: HealthDataClient,
  userId: string,
  input: LifeTrackerLogInput,
  occurredAt: string,
  refreshSummaries: boolean,
) {
  const payload = waterInputSchema.parse({
    amount_ml: getWaterAmountMl(input),
    created_at: occurredAt,
  });
  const { data, error } = await supabase
    .from("water_logs")
    .insert({ user_id: userId, ...payload })
    .select("id")
    .single();

  throwIfSupabaseError(error, "create life-tracker water log");

  if (refreshSummaries) {
    await refreshAfterLogChange(supabase, userId, "water", occurredAt);
  }

  return { type: "water_logs", id: getRowId(data) };
}

async function insertMealLog(
  supabase: HealthDataClient,
  userId: string,
  input: LifeTrackerLogInput,
  occurredAt: string,
  refreshSummaries: boolean,
) {
  const payload = mealInputSchema.parse({
    meal_type: normalizeMealType(input),
    food_name: buildFoodName(input),
    calories: readNumber(input.details, "calories") ?? readNumber(input.details, "estimatedCalories"),
    protein_g: readNumber(input.details, "proteinG") ?? readNumber(input.details, "protein_g"),
    carbs_g: readNumber(input.details, "carbsG") ?? readNumber(input.details, "carbs_g"),
    fat_g: readNumber(input.details, "fatG") ?? readNumber(input.details, "fat_g"),
    fiber_g: readNumber(input.details, "fiberG") ?? readNumber(input.details, "fiber_g"),
    sugar_g: readNumber(input.details, "sugarG") ?? readNumber(input.details, "sugar_g"),
    sodium_mg: readNumber(input.details, "sodiumMg") ?? readNumber(input.details, "sodium_mg"),
    notes: buildMealNote(input),
    created_at: occurredAt,
  });
  const { data, error } = await supabase
    .from("meals")
    .insert({ user_id: userId, ...payload })
    .select("id")
    .single();

  throwIfSupabaseError(error, "create life-tracker meal log");

  if (refreshSummaries) {
    await refreshAfterLogChange(supabase, userId, "meal", occurredAt);
  }

  return { type: "meals", id: getRowId(data) };
}

async function insertToiletLog(
  supabase: HealthDataClient,
  userId: string,
  input: LifeTrackerLogInput,
  occurredAt: string,
) {
  const { data, error } = await supabase
    .from("bowel_urine_logs")
    .insert({
      user_id: userId,
      logged_at: occurredAt,
      bowel_movement: readBoolean(input.details, "bowelMovement") ?? true,
      stool_type: clampOptionalInt(readNumber(input.details, "stoolType"), 1, 7),
      urine_color: normalizeUrineColor(readString(input.details, "urineColor")),
      pain_flag: readBoolean(input.details, "painFlag") ?? false,
      blood_flag: readBoolean(input.details, "bloodFlag") ?? false,
      fever_flag: readBoolean(input.details, "feverFlag") ?? false,
      dehydration_concern: readBoolean(input.details, "dehydrationConcern") ?? false,
      notes: input.note,
      safety_flag: buildToiletSafetyFlag(input),
    })
    .select("id")
    .single();

  throwIfSupabaseError(error, "create life-tracker toilet log");

  return { type: "bowel_urine_logs", id: getRowId(data) };
}

async function insertMoodLog(
  supabase: HealthDataClient,
  userId: string,
  input: LifeTrackerLogInput,
) {
  const moodScore = clampOptionalInt(readNumber(input.details, "moodScore"), 1, 10);
  const stressScore = clampOptionalInt(readNumber(input.details, "stressScore"), 1, 10);
  const energyScore = clampOptionalInt(readNumber(input.details, "energyScore"), 1, 10);
  const userText = readString(input.details, "userText") ?? input.note;
  const bodyLinks = readStringArray(input.details, "bodyLinks").slice(0, 8);
  const analysis = analyzeMood({
    moodScore,
    stressScore,
    energyScore,
    emotionLabel: readString(input.details, "emotionLabel"),
    triggerCategory: readString(input.details, "triggerCategory") ?? "unknown",
    bodyLinks,
    userText,
    locale: "zh-Hant",
  });
  const { data, error } = await supabase
    .from("mood_logs")
    .insert({
      user_id: userId,
      mood_score: moodScore,
      stress_score: stressScore,
      energy_score: energyScore,
      emotion_label: analysis.emotionLabel,
      trigger_category: readString(input.details, "triggerCategory") ?? "unknown",
      body_links: bodyLinks,
      user_text: userText,
      ai_reflection: analysis.userFacingReflection,
      suggested_action: analysis.suggestedSmallAction,
      safety_flag: analysis.safetyFlags[0] ?? null,
    })
    .select("id")
    .single();

  throwIfSupabaseError(error, "create life-tracker mood log");

  return { type: "mood_logs", id: getRowId(data) };
}

async function upsertDailyHealthLog(
  supabase: HealthDataClient,
  userId: string,
  values: {
    log_date: string;
    wake_time?: string;
    body_notes?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("daily_health_logs")
    .upsert(
      stripUndefined({
        user_id: userId,
        ...values,
      }),
      { onConflict: "user_id,log_date" },
    )
    .select("id")
    .single();

  throwIfSupabaseError(error, "upsert life-tracker daily health log");

  return { type: "daily_health_logs", id: getRowId(data) };
}

async function insertPhotoJournalEntry(
  supabase: HealthDataClient,
  userId: string,
  input: LifeTrackerLogInput,
) {
  const observation = sanitizePhotoJournalText(
    readString(input.details, "observationZh") ??
      readString(input.details, "summaryZh") ??
      input.note ??
      "我見到：呢張相可以作生活記錄。",
  );
  const { data, error } = await supabase
    .from("photo_journal_entries")
    .insert({
      user_id: userId,
      category: normalizePhotoCategory(readString(input.details, "category")),
      observation_zh: observation,
      user_note_zh: input.note ? sanitizePhotoJournalText(input.note) : null,
      confirmed_by_user: true,
    })
    .select("id")
    .single();

  throwIfSupabaseError(error, "create life-tracker photo journal entry");

  return { type: "photo_journal_entries", id: getRowId(data) };
}

function isMealLikePhoto(input: LifeTrackerLogInput) {
  const category = readString(input.details, "category");

  return (
    input.action === "meal" ||
    category === "food" ||
    category === "drink" ||
    Boolean(readString(input.details, "mealType")) ||
    Boolean(readString(input.details, "mealName")) ||
    Boolean(readNumber(input.details, "estimatedCalories")) ||
    Boolean(readNumber(input.details, "proteinG"))
  );
}

function normalizeMealType(input: LifeTrackerLogInput) {
  const candidate =
    readString(input.details, "meal_type") ??
    readString(input.details, "mealType");

  if (candidate === "breakfast" || candidate === "lunch" || candidate === "dinner" || candidate === "snack") {
    return candidate;
  }

  return input.action === "meal" ? "snack" : "other";
}

function buildFoodName(input: LifeTrackerLogInput) {
  const name =
    readString(input.details, "foodName") ??
    readString(input.details, "food_name") ??
    readString(input.details, "mealName") ??
    readString(input.details, "description") ??
    input.note ??
    (input.action === "photo_text" ? "相片餐點 / Photo meal" : "食咗 / I ate");

  return truncate(name, 160);
}

function buildMealNote(input: LifeTrackerLogInput) {
  const parts = [
    input.action === "photo_text" ? "相片已轉成文字和粗略營養估算；未保存原圖。" : null,
    readString(input.details, "summaryZh"),
    readString(input.details, "description"),
    input.note,
    readBoolean(input.details, "highSugarFlag") ? "AI 標記：可能較高糖。" : null,
    readBoolean(input.details, "highSodiumFlag") ? "AI 標記：可能較高鈉。" : null,
  ].filter(Boolean);

  return truncate(parts.join(" "), 1000) || null;
}

function getWaterAmountMl(input: LifeTrackerLogInput) {
  const amount = input.amount ?? readNumber(input.details, "waterMl") ?? readNumber(input.details, "amountMl");

  return amount && amount > 0 ? Math.round(amount) : 250;
}

function buildSickBodyNote(input: LifeTrackerLogInput) {
  const category = readString(input.details, "discomfortCategory") ?? readString(input.details, "category") ?? "unknown";

  return `simple_discomfort:${truncate(category, 80)}`;
}

function buildToiletSafetyFlag(input: LifeTrackerLogInput) {
  if (readBoolean(input.details, "bloodFlag")) {
    return "blood_flag";
  }

  if (readBoolean(input.details, "painFlag")) {
    return "pain_flag";
  }

  if (readBoolean(input.details, "feverFlag")) {
    return "fever_flag";
  }

  return null;
}

function normalizeUrineColor(value: string | null) {
  const allowed = new Set(["clear", "pale_yellow", "yellow", "dark_yellow", "brown_red_pink", "unknown"]);

  return value && allowed.has(value) ? value : "unknown";
}

function normalizePhotoCategory(value: string | null) {
  const allowed = new Set([
    "food",
    "drink",
    "exercise",
    "walk",
    "gym",
    "sleep_rest",
    "mood_life",
    "medicine_supplement",
    "toilet_note",
    "doctor_document",
    "insurance_document",
    "unknown",
  ]);

  return value && allowed.has(value) ? value : "unknown";
}

function readString(details: Record<string, unknown>, key: string) {
  const value = details[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(details: Record<string, unknown>, key: string) {
  const value = details[key];
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

  return Number.isFinite(number) ? number : null;
}

function readBoolean(details: Record<string, unknown>, key: string) {
  const value = details[key];

  return typeof value === "boolean" ? value : null;
}

function readStringArray(details: Record<string, unknown>, key: string) {
  const value = details[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 120))
    : [];
}

function clampOptionalInt(value: number | null, min: number, max: number) {
  if (value == null) {
    return null;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function truncate(value: string, max: number) {
  return value.trim().slice(0, max);
}

function getRowId(data: unknown) {
  if (data && typeof data === "object" && "id" in data && typeof data.id === "string") {
    return data.id;
  }

  return "";
}

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}
