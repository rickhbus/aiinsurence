import { z } from "zod";

export const emotionAnalysisInputSchema = z.object({
  text: z.string().trim().min(1).max(3000),
  language: z.enum(["zh-Hant", "en"]).default("zh-Hant"),
  caseId: z.string().uuid().optional().nullable(),
  save: z.boolean().optional().default(true),
});

export type EmotionAnalysisInput = z.infer<typeof emotionAnalysisInputSchema>;
