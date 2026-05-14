import type { CoachStyle, LocalizedText, QuestCoachResponse } from "./types";

export type { CoachStyle };

const safetyNote: LocalizedText = {
  zh: "如果情況嚴重或緊急，請立即致電 999 或前往急症室。",
  en: "If this is severe or urgent, call 999 or go to Accident & Emergency now.",
};

const notDiagnosis: LocalizedText = {
  zh: "呢個係一般生活健康支援，唔係診斷。",
  en: "This is general lifestyle support, not a diagnosis.",
};

export function buildCoachStyleResponse(style: CoachStyle, topic: "water" | "mood" | "movement" | "recovery" = "water"): QuestCoachResponse {
  const nextTinyStep = nextStep(topic);
  const baseReason = {
    zh: "細小行動比大目標更容易持續。",
    en: "Small actions are easier to repeat than big goals.",
  };

  const encouragementByStyle: Record<CoachStyle, LocalizedText> = {
    gentle: {
      zh: "細小一步都算數。一杯水已經可以令今日繼續前進。",
      en: "Small steps count. One glass of water is enough to keep today moving.",
    },
    direct: {
      zh: "而家做最細版本：飲一杯水。",
      en: "Do the smallest version now: drink one glass of water.",
    },
    family_doctor: {
      zh: "呢個係一般生活健康支援，唔係診斷。先由補水開始，並留意嚴重症狀。",
      en: "This is general lifestyle support, not a diagnosis. Start with hydration and watch for severe symptoms.",
    },
    gym: {
      zh: "做最輕量版本。唔舒服就休息，恢復都算數。",
      en: "Do the lightest version. If unwell, rest; recovery counts.",
    },
    calm: {
      zh: "慢慢嚟。下一步只需要一個小動作。",
      en: "Go slowly. The next step is just one tiny action.",
    },
    bilingual: {
      zh: "細小一步都算數。Small steps count.",
      en: "Small steps count. 細小一步都算數。",
    },
  };

  return {
    encouragement: encouragementByStyle[style],
    reason: baseReason,
    nextTinyStep,
    safetyNote,
    notDiagnosis,
  };
}

export function safetyResponseInvariant() {
  return { safetyNote, notDiagnosis };
}

function nextStep(topic: "water" | "mood" | "movement" | "recovery"): LocalizedText {
  const steps = {
    water: { zh: "飲一杯水。", en: "Drink one glass of water." },
    mood: { zh: "點一個表情符號。", en: "Tap one emoji." },
    movement: { zh: "站起身伸展 30 秒。", en: "Stand up and stretch for 30 seconds." },
    recovery: { zh: "選擇休息都算數。", en: "Choose rest counts." },
  };

  return steps[topic];
}
