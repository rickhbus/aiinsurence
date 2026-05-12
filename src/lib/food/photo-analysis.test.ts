import { describe, expect, it } from "vitest";
import { FOOD_PHOTO_PROVIDER_UNAVAILABLE_MESSAGE, analyzeFoodPhoto } from "./photo-analysis";

describe("food photo analysis", () => {
  it("returns provider unavailable without AI provider config", async () => {
    const result = await analyzeFoodPhoto(
      {
        imageBytes: new Uint8Array([1, 2, 3]),
        mediaType: "image/png",
      },
      { env: {} },
    );

    expect(result.status).toBe("unconfigured");
    expect(result.analysis.summaryZh).toBe(FOOD_PHOTO_PROVIDER_UNAVAILABLE_MESSAGE);
    expect(result.analysis.estimatedCalories).toBeNull();
  });

  it("returns structured estimates with a mocked provider", async () => {
    const result = await analyzeFoodPhoto(
      {
        imageBytes: new Uint8Array([1, 2, 3]),
        mediaType: "image/png",
        description: "雞飯少汁",
      },
      {
        env: { DEEPSEEK_API_KEY: "test-key" },
        provider: async () => ({
          mealName: "雞飯少汁",
          estimatedCalories: 620,
          proteinG: 32,
          carbsG: 78,
          fatG: 18,
          fiberG: 4,
          waterMl: null,
          caffeineMg: null,
          alcoholUnits: null,
          highSugarFlag: false,
          highSodiumFlag: true,
          confidence: "medium",
          summaryZh: "粗略估算是雞飯，份量和醬汁未必準確。",
          disclaimerZh: "只供一般記錄參考，不是醫療營養診斷。",
        }),
      },
    );

    expect(result.status).toBe("generated");
    expect(result.analysis).toMatchObject({
      mealName: "雞飯少汁",
      estimatedCalories: 620,
      confidence: "medium",
      highSodiumFlag: true,
    });
  });
});
