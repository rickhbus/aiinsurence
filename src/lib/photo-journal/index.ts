import { generateObject } from "ai";
import { z } from "zod";
import { getGuideModel, getGuideRuntimeConfig, type GuideRuntimeConfig } from "@/lib/ai/provider";

export const photoJournalCategories = [
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
] as const;

export type PhotoJournalCategory = typeof photoJournalCategories[number];

export const photoJournalAnalysisSchema = z.object({
  category: z.enum(photoJournalCategories),
  observationZh: z.string().trim().min(1).max(240),
  safetyNoticeZh: z.string().trim().max(500).nullable(),
  confidence: z.enum(["low", "medium", "high"]),
});

export const photoJournalSaveSchema = z.object({
  action: z.literal("save"),
  category: z.enum(photoJournalCategories),
  observationZh: z.string().trim().min(1).max(240),
  userNoteZh: z.string().trim().max(500).optional().nullable(),
});

export type PhotoJournalAnalysis = z.infer<typeof photoJournalAnalysisSchema>;

export const photoJournalRequiresConfirmation = true;

export function getFallbackPhotoJournalAnalysis(): PhotoJournalAnalysis {
  return {
    category: "unknown",
    observationZh: "我見到：呢張相可以作生活記錄。",
    safetyNoticeZh: null,
    confidence: "low",
  };
}

export function sanitizePhotoJournalText(value: string) {
  return value
    .replace(/[A-Z]\d{6}\(?[0-9A]\)?/gi, "[已移除身份資料]")
    .replace(/\b\d{8}\b/g, "[已移除電話]")
    .replace(/\b(?:policy|保單)\s*[:#]?\s*[A-Z0-9-]{4,}\b/gi, "[已移除保單資料]")
    .slice(0, 500);
}

export function getPhotoJournalSafetyNotice(analysis: PhotoJournalAnalysis) {
  const text = `${analysis.category} ${analysis.observationZh}`.toLowerCase();

  if (/blood|bleed|wound|rash|傷口|流血|出血|紅疹|皮疹|嚴重|痛/.test(text)) {
    return "如果有嚴重痛楚、出血、呼吸困難、胸痛、昏迷或其他緊急情況，請立即打 999 或去急症室。相片不會用作診斷。";
  }

  if (analysis.category === "medicine_supplement") {
    return "藥物或補充劑只會作你確認的生活記錄，不提供劑量、加減藥或停藥建議。";
  }

  if (analysis.category === "doctor_document" || analysis.category === "insurance_document") {
    return "文件相片不會保存身份證、保單號碼、電話、地址或付款資料。";
  }

  return analysis.safetyNoticeZh;
}

export async function analyzePhotoJournalImage(
  input: { imageBytes?: Uint8Array; mediaType?: string },
  options: {
    env?: Record<string, string | undefined>;
    provider?: (input: { imageBytes: Uint8Array; mediaType?: string; config: GuideRuntimeConfig }) => Promise<PhotoJournalAnalysis>;
  } = {},
) {
  const config = getGuideRuntimeConfig(options.env);

  if (!config.isConfigured || !input.imageBytes) {
    return getFallbackPhotoJournalAnalysis();
  }

  try {
    const provider = options.provider ?? generatePhotoJournalAnalysis;
    const analysis = photoJournalAnalysisSchema.parse(await provider({
      imageBytes: input.imageBytes,
      mediaType: input.mediaType,
      config,
    }));

    return {
      ...analysis,
      observationZh: sanitizePhotoJournalText(analysis.observationZh),
      safetyNoticeZh: getPhotoJournalSafetyNotice(analysis),
    };
  } catch {
    return getFallbackPhotoJournalAnalysis();
  }
}

async function generatePhotoJournalAnalysis(input: {
  imageBytes: Uint8Array;
  mediaType?: string;
  config: GuideRuntimeConfig;
}) {
  const { object } = await generateObject({
    model: getGuideModel(input.config),
    schema: photoJournalAnalysisSchema,
    system: `You describe a photo for a senior-friendly Hong Kong life journal.

Rules:
- Return Traditional Chinese.
- Start observationZh with "我見到：".
- Never identify people.
- Never diagnose, assess wounds, or infer medical conditions.
- Never extract HKID, policy numbers, phone numbers, addresses, payment data, or other sensitive identifiers.
- If medicine or supplements appear, do not provide dosage, start, stop, or medication-change advice.
- If an emergency-like image appears, use safetyNoticeZh to tell the user to call 999 or go to A&E now.`,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe the likely daily-life activity in this photo. The user must confirm before anything is saved." },
          { type: "image", image: input.imageBytes, mediaType: input.mediaType },
        ],
      },
    ],
    temperature: 0.1,
    maxRetries: 0,
    maxOutputTokens: 500,
    timeout: { totalMs: 12000 },
  });

  return object;
}
