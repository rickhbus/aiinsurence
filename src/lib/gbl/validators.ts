import { z } from "zod";

export const gblAnalysisInputSchema = z.object({
  title: z.string().trim().min(1).max(140),
  analysisType: z
    .enum([
      "healthcare_navigation",
      "insurance_analysis",
      "emotion_context",
      "general_case",
    ])
    .default("general_case"),
  userType: z
    .enum([
      "patient_member",
      "provider_admin",
      "broker_advisor",
      "employer_hr",
      "internal_admin",
      "unknown",
    ])
    .default("patient_member"),
  language: z.enum(["zh-Hant", "en"]).default("zh-Hant"),
  primaryConcern: z.string().trim().min(1).max(3000),
  healthcareContext: z.string().trim().max(2000).optional().nullable(),
  insuranceContext: z.string().trim().max(3000).optional().nullable(),
  emotionText: z.string().trim().max(3000).optional().nullable(),
  previousSummary: z.string().trim().max(2000).optional().nullable(),
  save: z.boolean().optional().default(true),
});

export type GblAnalysisInput = z.infer<typeof gblAnalysisInputSchema>;
