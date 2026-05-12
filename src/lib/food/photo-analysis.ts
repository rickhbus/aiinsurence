import { generateObject } from "ai";
import { z } from "zod";
import { getGuideModel, getGuideRuntimeConfig, type GuideRuntimeConfig } from "@/lib/ai/provider";

export const FOOD_PHOTO_PROVIDER_UNAVAILABLE_MESSAGE =
  "圖片分析暫時未啟用，你仍可用文字記錄。";

const disclaimerZh =
  "相片營養估算只供一般健康記錄參考，不是醫療營養診斷；如有疾病、過敏、懷孕或治療需要，請向合資格醫護或營養專業人士確認。";

export const foodPhotoAnalysisSchema = z.object({
  mealName: z.string().trim().min(1).max(160).nullable(),
  estimatedCalories: z.number().int().min(0).max(5000).nullable(),
  proteinG: z.number().min(0).max(500).nullable(),
  carbsG: z.number().min(0).max(800).nullable(),
  fatG: z.number().min(0).max(400).nullable(),
  fiberG: z.number().min(0).max(200).nullable(),
  waterMl: z.number().int().min(0).max(5000).nullable(),
  caffeineMg: z.number().int().min(0).max(1200).nullable(),
  alcoholUnits: z.number().min(0).max(30).nullable(),
  highSugarFlag: z.boolean(),
  highSodiumFlag: z.boolean(),
  confidence: z.enum(["low", "medium", "high"]),
  summaryZh: z.string().trim().min(1).max(900),
  disclaimerZh: z.string().trim().min(1).max(900),
});

export type FoodPhotoAnalysis = z.infer<typeof foodPhotoAnalysisSchema>;

export type FoodPhotoAnalysisStatus = "generated" | "unconfigured" | "failed";

export type FoodPhotoAnalysisResult = {
  status: FoodPhotoAnalysisStatus;
  analysis: FoodPhotoAnalysis;
};

export type FoodPhotoAnalysisInput = {
  imageBytes?: Uint8Array;
  imageUrl?: string;
  mediaType?: string;
  mealType?: string | null;
  description?: string | null;
};

export type FoodPhotoAnalysisProvider = (
  input: FoodPhotoAnalysisInput & { config: GuideRuntimeConfig },
) => Promise<FoodPhotoAnalysis>;

export function getProviderUnavailableFoodAnalysis(): FoodPhotoAnalysis {
  return {
    mealName: null,
    estimatedCalories: null,
    proteinG: null,
    carbsG: null,
    fatG: null,
    fiberG: null,
    waterMl: null,
    caffeineMg: null,
    alcoholUnits: null,
    highSugarFlag: false,
    highSodiumFlag: false,
    confidence: "low",
    summaryZh: FOOD_PHOTO_PROVIDER_UNAVAILABLE_MESSAGE,
    disclaimerZh,
  };
}

export async function analyzeFoodPhoto(
  input: FoodPhotoAnalysisInput,
  options: {
    env?: Record<string, string | undefined>;
    provider?: FoodPhotoAnalysisProvider;
  } = {},
): Promise<FoodPhotoAnalysisResult> {
  const config = getGuideRuntimeConfig(options.env);

  if (!config.isConfigured || (!input.imageBytes && !input.imageUrl)) {
    return {
      status: "unconfigured",
      analysis: getProviderUnavailableFoodAnalysis(),
    };
  }

  try {
    const provider = options.provider ?? generateFoodPhotoAnalysis;
    const analysis = foodPhotoAnalysisSchema.parse(await provider({ ...input, config }));

    return {
      status: "generated",
      analysis: {
        ...analysis,
        disclaimerZh: analysis.disclaimerZh || disclaimerZh,
      },
    };
  } catch {
    return {
      status: "failed",
      analysis: getProviderUnavailableFoodAnalysis(),
    };
  }
}

async function generateFoodPhotoAnalysis(
  input: FoodPhotoAnalysisInput & { config: GuideRuntimeConfig },
): Promise<FoodPhotoAnalysis> {
  const imagePart = input.imageBytes
    ? {
        type: "image" as const,
        image: input.imageBytes,
        mediaType: input.mediaType,
      }
    : {
        type: "image" as const,
        image: new URL(input.imageUrl!),
        mediaType: input.mediaType,
      };

  const { object } = await generateObject({
    model: getGuideModel(input.config),
    schema: foodPhotoAnalysisSchema,
    system: FOOD_PHOTO_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Analyze this meal photo for a Hong Kong daily health log.",
              "Use cautious estimates only. Do not identify medical conditions.",
              `Meal type: ${input.mealType ?? "unknown"}.`,
              `User note: ${input.description ?? "none"}.`,
              `Required disclaimer: ${disclaimerZh}`,
            ].join("\n"),
          },
          imagePart,
        ],
      },
    ],
    temperature: 0.1,
    maxRetries: 0,
    maxOutputTokens: 700,
    timeout: { totalMs: 12000 },
  });

  return object;
}

const FOOD_PHOTO_SYSTEM_PROMPT = `You estimate food from images for a Hong Kong health journal.

Rules:
- Do not pretend certainty.
- Use null when the image does not support a value.
- Use "estimated", "rough", and uncertainty language.
- Do not diagnose, prescribe, or provide medical nutrition advice.
- Do not infer identity or protected traits.
- Return Traditional Chinese in summaryZh and disclaimerZh.
- Keep disclaimerZh safety-focused and non-diagnostic.`;
