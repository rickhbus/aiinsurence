import { describe, expect, it } from "vitest";
import {
  lifeTrackerLogInputSchema,
  saveLifeTrackerLog,
} from "./life-tracker";

describe("life tracker logging", () => {
  it("maps water taps to a high-level check-in and real water log", async () => {
    const fake = createFakeSupabase();

    const result = await saveLifeTrackerLog({
      supabase: fake.client as never,
      userId: "user-1",
      input: lifeTrackerLogInputSchema.parse({ action: "water" }),
      refreshSummaries: false,
    });

    expect(result.saved).toBe(true);
    expect(fake.calls.map((call) => call.table)).toEqual(["daily_checkins", "water_logs"]);
    expect(fake.calls[0]?.payload).toMatchObject({
      checkin_type: "water",
      label: "飲咗水",
      amount: 250,
      unit: "ml",
      metadata: { source: "life_tracker", action: "water", rawPhotoStored: false },
    });
    expect(fake.calls[1]?.payload).toMatchObject({ amount_ml: 250 });
  });

  it("maps meal taps to a high-level check-in and minimal meal row", async () => {
    const fake = createFakeSupabase();

    await saveLifeTrackerLog({
      supabase: fake.client as never,
      userId: "user-1",
      input: lifeTrackerLogInputSchema.parse({
        action: "meal",
        note: "雞飯少汁",
        details: { mealType: "lunch", proteinG: 32 },
      }),
      refreshSummaries: false,
    });

    expect(fake.calls.map((call) => call.table)).toEqual(["daily_checkins", "meals"]);
    expect(fake.calls[1]?.payload).toMatchObject({
      meal_type: "lunch",
      food_name: "雞飯少汁",
      protein_g: 32,
    });
    expect(JSON.stringify(fake.calls[1]?.payload)).not.toContain("imagePath");
  });

  it("maps toilet taps to safe default bowel and urine records", async () => {
    const fake = createFakeSupabase();

    await saveLifeTrackerLog({
      supabase: fake.client as never,
      userId: "user-1",
      input: lifeTrackerLogInputSchema.parse({ action: "toilet" }),
      refreshSummaries: false,
    });

    expect(fake.calls.map((call) => call.table)).toEqual(["daily_checkins", "bowel_urine_logs"]);
    expect(fake.calls[1]?.payload).toMatchObject({
      bowel_movement: true,
      urine_color: "unknown",
      pain_flag: false,
      blood_flag: false,
      fever_flag: false,
      dehydration_concern: false,
    });
  });

  it("does not turn casual movement taps into fake gym or running volume", async () => {
    const fake = createFakeSupabase();

    await saveLifeTrackerLog({
      supabase: fake.client as never,
      userId: "user-1",
      input: lifeTrackerLogInputSchema.parse({ action: "move", note: "行咗一陣" }),
      refreshSummaries: false,
    });

    expect(fake.calls.map((call) => call.table)).toEqual(["daily_checkins"]);
    expect(fake.calls.some((call) => /gym|running|workout/.test(call.table))).toBe(false);
  });

  it("saves confirmed food photos as text and structured meal data without raw photo storage", async () => {
    const fake = createFakeSupabase();

    await saveLifeTrackerLog({
      supabase: fake.client as never,
      userId: "user-1",
      input: lifeTrackerLogInputSchema.parse({
        action: "photo_text",
        note: "雞飯少汁，加菜。",
        details: {
          category: "food",
          mealType: "lunch",
          mealName: "雞飯",
          estimatedCalories: 650,
          proteinG: 35,
          summaryZh: "粗略估算：雞飯少汁。",
        },
      }),
      refreshSummaries: false,
    });

    expect(fake.calls.map((call) => call.table)).toEqual(["daily_checkins", "meals"]);
    expect(fake.calls[0]?.payload).toMatchObject({
      metadata: { rawPhotoStored: false, category: "food" },
    });
    expect(fake.calls[1]?.payload).toMatchObject({
      food_name: "雞飯",
      calories: 650,
      protein_g: 35,
      notes: expect.stringContaining("未保存原圖"),
    });
    expect(JSON.stringify(fake.calls)).not.toContain("browser-upload");
  });
});

function createFakeSupabase() {
  const calls: Array<{ table: string; operation: "insert" | "upsert"; payload: unknown }> = [];

  return {
    calls,
    client: {
      from(table: string) {
        return createQuery(table, calls);
      },
    },
  };
}

function createQuery(
  table: string,
  calls: Array<{ table: string; operation: "insert" | "upsert"; payload: unknown }>,
) {
  return {
    insert(payload: unknown) {
      calls.push({ table, operation: "insert", payload });
      return createQuery(table, calls);
    },
    upsert(payload: unknown) {
      calls.push({ table, operation: "upsert", payload });
      return createQuery(table, calls);
    },
    select() {
      return createQuery(table, calls);
    },
    single() {
      return Promise.resolve({
        data: { id: `${table}-id` },
        error: null,
      });
    },
  };
}
