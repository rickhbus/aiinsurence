import { safetyNextStep } from "./safety";
import type {
  GblCaseContext,
  GblRecommendation,
  GblSafetyFlags,
  GblWorkflowPlan,
} from "./types";

export function buildDeterministicGblOutput({
  context,
  flags,
}: {
  context: GblCaseContext;
  flags: GblSafetyFlags;
}) {
  const summaryParts = [
    `Case: ${context.title}`,
    `Type: ${context.analysisType}`,
    context.healthcare.concern ? `Healthcare concern: ${context.healthcare.concern}` : null,
    context.insurance.coverageQuestion ? `Insurance context: ${context.insurance.coverageQuestion}` : null,
    context.emotion.analysis
      ? `Emotion signal: ${context.emotion.analysis.primary_emotion}, urgency ${context.emotion.analysis.urgency_level}`
      : null,
  ].filter(Boolean);

  return {
    aiReadySummary: summaryParts.join("\n"),
    userVisibleSummary: buildUserSummary(context, flags),
    workflowPlan: buildWorkflowPlan(context, flags),
    recommendations: buildRecommendations(context, flags),
  };
}

function buildUserSummary(context: GblCaseContext, flags: GblSafetyFlags) {
  const locale = context.user.locale;

  if (flags.selfHarm || flags.emergency) {
    return safetyNextStep(flags, locale);
  }

  if (locale === "zh-Hant") {
    if (context.analysisType === "insurance_analysis") {
      return "AI.GBL 已將保險與醫療背景整理成可覆核個案：先列出文件缺口、要問保險公司或持牌顧問的問題，以及不能判斷的部分；不會判斷承保、保障或索償結果。";
    }

    if (context.analysisType === "emotion_context") {
      return "AI.GBL 已把情緒背景整理成語氣訊號，只用來令下一步更清晰和溫和；它不是臨床評估，也不能影響保險或照護決定。";
    }

    if (context.analysisType === "healthcare_navigation") {
      return "AI.GBL 已把照護導航背景、危險警號和下一步整理好，讓助理可以謹慎地建議求助路線，而不是作出診斷。";
    }

    return "AI.GBL 已把醫療、保險、情緒和安全背景整理成可交接的個案摘要，供下一個安全工作流使用。";
  }

  if (context.analysisType === "insurance_analysis") {
    return "AI.GBL organized your insurance and healthcare context into a reviewable case. It highlights likely questions, missing documents, and uncertainty without deciding eligibility or claim outcomes.";
  }

  if (context.analysisType === "emotion_context") {
    return "AI.GBL prepared the emotional context as an empathy and tone signal only. It is not a clinical assessment and must not change insurance reasoning.";
  }

  if (context.analysisType === "healthcare_navigation") {
    return "AI.GBL organized the care-navigation context and safety signals so the assistant can suggest a cautious next step without diagnosing.";
  }

  return "AI.GBL normalized the case into healthcare, insurance, emotion, and safety context for downstream assistants.";
}

function buildWorkflowPlan(
  context: GblCaseContext,
  flags: GblSafetyFlags,
): GblWorkflowPlan {
  const locale = context.user.locale;
  const zh = locale === "zh-Hant";

  if (flags.emergency || flags.selfHarm) {
    return {
      lane: "safety",
      stage: zh ? "安全鎖定" : "Safety locked",
      primaryUse: zh ? "立即升級至緊急或危機指引" : "Escalate immediately to emergency or crisis guidance",
      blockedUses: [
        zh ? "等待 AI 追問" : "Waiting for AI follow-up",
        zh ? "等待保險確認" : "Waiting for insurance confirmation",
        zh ? "保存或延長一般流程" : "Saving or extending the ordinary workflow",
      ],
      immediateActions: [safetyNextStep(flags, locale)],
      handoff: zh ? "999 / 急症室 / 可信任支援者" : "999 / A&E / trusted support person",
      businessValue: zh
        ? "安全邊界先於任何增長、付款或保險流程。"
        : "Safety boundaries outrank growth, payment, and insurance workflows.",
    };
  }

  if (context.analysisType === "insurance_analysis") {
    return {
      lane: "insurance_education",
      stage: zh ? "文件與問題整理" : "Document and question organization",
      primaryUse: zh
        ? "整理保單、索償文件、時間線和要問保險公司/持牌顧問的問題"
        : "Organize policy wording, claim documents, timeline, and questions for the insurer or licensed adviser",
      blockedUses: [
        zh ? "承保或拒保判斷" : "Underwriting or denial decisions",
        zh ? "保障、賠償或索償結果保證" : "Coverage, reimbursement, or claim outcome guarantees",
        zh ? "用情緒或健康日誌作定價、資格或照護使用權決定" : "Using emotion or health logs for pricing, eligibility, or care-access decisions",
      ],
      immediateActions: [
        zh ? "列出缺少的文件和日期" : "List missing documents and dates",
        zh ? "把問題分成保險公司、僱主福利和醫生報告三類" : "Split questions into insurer, employer benefits, and doctor-report groups",
        zh ? "標記需要人工覆核的位置" : "Mark anything that needs human review",
      ],
      handoff: zh ? "保險公司、僱主福利管理員或持牌顧問" : "Insurer, employer benefits administrator, or licensed adviser",
      businessValue: zh
        ? "可支援家庭訂閱與教育型合作，但不觸碰銷售建議或索償決定。"
        : "Supports family subscriptions and education partnerships without crossing into sales advice or claim decisions.",
    };
  }

  if (context.analysisType === "healthcare_navigation") {
    return {
      lane: "care_navigation",
      stage: zh ? "安全導航" : "Safe navigation",
      primaryUse: zh
        ? "把症狀時間線、求醫偏好和可能科別整理成下一步"
        : "Turn symptom timeline, care preference, and likely departments into the next step",
      blockedUses: [
        zh ? "診斷疾病" : "Diagnosing disease",
        zh ? "處方或劑量建議" : "Prescribing or dosage advice",
        zh ? "取代臨床判斷" : "Replacing clinical judgment",
      ],
      immediateActions: [
        safetyNextStep(flags, locale),
        zh ? "準備一頁式覆診摘要" : "Prepare a one-page visit summary",
      ],
      handoff: zh ? "普通科、家庭醫生、專科或急症服務" : "GP, family doctor, specialist, or emergency care",
      businessValue: zh
        ? "把每日記錄轉成可交接的照護準備，適合家庭和診所準備流程。"
        : "Turns daily logs into handoff-ready care preparation for family and clinic workflows.",
    };
  }

  if (context.analysisType === "emotion_context") {
    return {
      lane: "emotion_support",
      stage: zh ? "語氣支援" : "Tone support",
      primaryUse: zh
        ? "用情緒訊號調整回覆語氣和問題數量"
        : "Use emotion signal to adjust response tone and number of questions",
      blockedUses: [
        zh ? "心理健康診斷" : "Mental-health diagnosis",
        zh ? "保險資格、定價、保障或索償決定" : "Insurance eligibility, pricing, coverage, or claim decisions",
        zh ? "照護使用權決定" : "Care-access decisions",
      ],
      immediateActions: [
        zh ? "保持回覆短、穩定、可選擇" : "Keep the response short, steady, and optional",
        zh ? "如出現危機語句，先顯示緊急指引" : "If crisis language appears, show emergency guidance first",
      ],
      handoff: zh ? "用戶本人、照顧者或合適支援人士" : "User, caregiver, or appropriate support person",
      businessValue: zh
        ? "提升留存和信任，但不得變成臨床或保險決策訊號。"
        : "Improves retention and trust without becoming a clinical or insurance decision signal.",
    };
  }

  if (context.user.userType === "provider_admin" || context.user.userType === "employer_hr") {
    return {
      lane: "business_partner",
      stage: zh ? "合作準備" : "Partnership preparation",
      primaryUse: zh
        ? "整理匿名、匯總、教育型的合作需求"
        : "Organize anonymous, aggregate, education-first partnership needs",
      blockedUses: [
        zh ? "披露個人健康資料" : "Disclosing individual health data",
        zh ? "個別僱員或會員評分" : "Scoring individual employees or members",
        zh ? "保險或照護使用權決定" : "Insurance or care-access decisions",
      ],
      immediateActions: [
        zh ? "把需求分成家庭照護、員工健康、診所準備或健身留存" : "Map the need into family care, employer wellness, clinic prep, or fitness retention",
        zh ? "只收集合作聯絡資料，不收集健康或保單內容" : "Collect partnership contact details only, not health or policy content",
      ],
      handoff: zh ? "合作負責人 / Partnership owner" : "Partnership owner",
      businessValue: zh
        ? "支援 B2B 導入而不把敏感健康資料商業化。"
        : "Supports B2B adoption without commercializing sensitive health data.",
    };
  }

  return {
    lane: "general",
    stage: zh ? "個案整理" : "Case organization",
    primaryUse: zh ? "整理背景、下一步和人工覆核點" : "Organize context, next steps, and human-review points",
    blockedUses: [
      zh ? "醫療、法律或保險保證" : "Medical, legal, or insurance guarantees",
      zh ? "取代專業判斷" : "Replacing professional judgment",
    ],
    immediateActions: [
      safetyNextStep(flags, locale),
      zh ? "把不確定資料標記為需要核實" : "Mark uncertain details for verification",
    ],
    handoff: zh ? "合適專業人士" : "Appropriate professional",
    businessValue: zh
      ? "建立可審核、可交接、可擴展的安全 AI 工作流。"
      : "Creates an auditable, handoff-ready, scalable safe AI workflow.",
  };
}

function buildRecommendations(
  context: GblCaseContext,
  flags: GblSafetyFlags,
): GblRecommendation[] {
  const locale = context.user.locale;
  const zh = locale === "zh-Hant";
  const first: GblRecommendation = {
    label: flags.emergency || flags.selfHarm
      ? zh ? "安全優先" : "Safety first"
      : zh ? "先核實核心事實" : "Verify the core facts",
    rationale: flags.emergency || flags.selfHarm
      ? zh
        ? "緊急或危機語句必須覆蓋一般流程。"
        : "Potential urgent or crisis language must override normal workflows."
      : zh
        ? "醫療與保險結果取決於準確事實、文件和專業覆核。"
        : "Healthcare and insurance outcomes depend on exact facts, documents, and professional review.",
    nextStep: safetyNextStep(flags, locale),
    humanReview: flags.emergency || flags.selfHarm || flags.possibleDiagnosisRequest || flags.insuranceGuaranteeRequest,
  };
  const second: GblRecommendation = {
    label: zh ? "準備文件和問題" : "Prepare documents and questions",
    rationale: zh
      ? "結構化輸入可減少來回追問，並避免無根據結論。"
      : "Structured inputs reduce back-and-forth and avoid unsupported conclusions.",
    nextStep:
      context.analysisType === "insurance_analysis"
        ? zh
          ? "整理保單條款、索償表格、收據、保險公司訊息、轉介信和簡短時間線。"
          : "Gather plan wording, claim forms, receipts, insurer messages, referral letters, and a concise timeline."
        : zh
          ? "記錄症狀時間線、求醫偏好、關鍵問題和已收到的醫護指示。"
          : "Capture symptom timeline, care preference, key questions, and any clinician instructions already received.",
    humanReview: true,
  };
  const third: GblRecommendation = {
    label: zh ? "情緒只用作語氣" : "Use emotion only for tone",
    rationale: zh
      ? "情緒訊號可改善清晰度和同理心，但不得用於資格、定價、保障或照護使用權決定。"
      : "Emotion signals can improve clarity and empathy, but must not drive eligibility, pricing, coverage, or access decisions.",
    nextStep: zh
      ? "下一個助理回覆應保持溫和、具體，並讓用戶有選擇空間。"
      : "Keep the next assistant response gentle, concrete, and optional for the user.",
    humanReview: false,
  };

  return [first, second, third];
}
