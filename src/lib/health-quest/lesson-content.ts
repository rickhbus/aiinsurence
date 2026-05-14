import type { LocalizedText, QuestType } from "./types";

export type LessonQuestionType =
  | "multiple_choice"
  | "true_false"
  | "tap_cards"
  | "order_steps"
  | "reflection_tap"
  | "scenario_choice";

export type LessonQuestion = {
  id: string;
  type: LessonQuestionType;
  question: LocalizedText;
  answers: Array<{ id: string; text: LocalizedText }>;
  correctAnswerId: string;
  explanation: LocalizedText;
};

export type LessonQuiz = {
  question: LocalizedText;
  answers: Array<{ id: string; text: LocalizedText }>;
  correctAnswerId: string;
};

export type LessonNodeKind = "lesson" | "practice" | "review" | "boss";
export type LessonNodeState = "locked" | "current" | "completed" | "perfect" | "review_due";

export type LessonNodeContent = {
  slug: string;
  title: LocalizedText;
  kind: LessonNodeKind;
  cards: LocalizedText[];
  quiz: LessonQuiz;
  questions: LessonQuestion[];
  xp: number;
  orderIndex: number;
  unlocksQuestType?: QuestType;
};

export type LessonTrackContent = {
  slug: string;
  unitNumber: number;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  lessons: LessonNodeContent[];
};

const genericBoundary = {
  zh: "如情況嚴重、持續或令你擔心，請尋求醫護協助；緊急情況請立即致電 999 或前往急症室。",
  en: "If anything is severe, persistent, or worrying, seek medical help; for emergencies call 999 or go to Accident & Emergency now.",
};

const insuranceBoundary = {
  zh: "健康任務不會用健康、心情、飲食、症狀、家庭或就診準備資料作保險資格、定價、保障、索償或醫療服務取用決定。",
  en: "Health Quest never uses health, mood, food, symptom, family, or doctor-prep data for insurance eligibility, pricing, coverage, claims, or care-access decisions.",
};

export const lessonTracks: LessonTrackContent[] = [
  buildUnit({
    unitNumber: 1,
    slug: "start-strong",
    zhTitle: "Start Strong",
    enTitle: "Start Strong",
    zhDescription: "由一個 30 秒健康小步開始。",
    enDescription: "Start with one 30-second health step.",
    icon: "sparkles",
    unlocksQuestType: "health_review",
    lessonTitles: [
      ["第一個小步", "First tiny step"],
      ["安全先行", "Safety first"],
      ["恢復都算數", "Recovery counts"],
      ["私隱小提醒", "Privacy basics"],
      ["每日完成感", "Daily completion"],
    ],
  }),
  buildUnit({
    unitNumber: 2,
    slug: "water-energy",
    zhTitle: "Water & Energy",
    enTitle: "Water & Energy",
    zhDescription: "用一杯水和能量提示建立節奏。",
    enDescription: "Build rhythm with one glass and energy cues.",
    icon: "droplets",
    unlocksQuestType: "water",
    lessonTitles: [
      ["由一杯水開始", "Start with one glass"],
      ["留意口渴訊號", "Notice thirst cues"],
      ["能量心心", "Energy hearts"],
      ["低能量路線", "Low-energy path"],
      ["補水複習", "Hydration review"],
    ],
  }),
  buildUnit({
    unitNumber: 3,
    slug: "mood-basics",
    zhTitle: "Mood Basics",
    enTitle: "Mood Basics",
    zhDescription: "心情是提示，不是診斷。",
    enDescription: "Mood is a signal, not a diagnosis.",
    icon: "smile",
    unlocksQuestType: "mood",
    lessonTitles: [
      ["一撳心情", "One-tap mood"],
      ["壓力不是分數", "Stress is not a score"],
      ["溫和反思", "Gentle reflection"],
      ["危機先處理", "Crisis comes first"],
      ["心情私隱", "Mood privacy"],
    ],
  }),
  buildUnit({
    unitNumber: 4,
    slug: "sleep-reset",
    zhTitle: "Sleep Reset",
    enTitle: "Sleep Reset",
    zhDescription: "用睡前小步幫自己降速。",
    enDescription: "Use a tiny wind-down step.",
    icon: "moon",
    unlocksQuestType: "sleep_prep",
    lessonTitles: [
      ["睡前 30 秒", "30-second wind-down"],
      ["明天再做", "Tomorrow is okay"],
      ["疲倦不羞恥", "Tired is not shameful"],
      ["睡眠安全界線", "Sleep safety boundaries"],
      ["睡眠複習", "Sleep review"],
    ],
  }),
  buildUnit({
    unitNumber: 5,
    slug: "food-awareness",
    zhTitle: "Food Awareness",
    enTitle: "Food Awareness",
    zhDescription: "留意飲食模式，不計卡路里、不羞辱。",
    enDescription: "Notice eating patterns with no calorie shame.",
    icon: "apple",
    unlocksQuestType: "meal",
    lessonTitles: [
      ["食咗就算數", "Eating counts"],
      ["不計道德分", "No moral scoring"],
      ["私隱餐點", "Private meals"],
      ["家庭分享界線", "Family sharing boundary"],
      ["飲食複習", "Food review"],
    ],
  }),
  buildUnit({
    unitNumber: 6,
    slug: "movement-starter",
    zhTitle: "Movement Starter",
    enTitle: "Movement Starter",
    zhDescription: "輕量郁動，恢復日都算數。",
    enDescription: "Move gently. Recovery days count.",
    icon: "dumbbell",
    unlocksQuestType: "movement",
    lessonTitles: [
      ["站起 30 秒", "Stand for 30 seconds"],
      ["痛楚要停", "Pain means pause"],
      ["恢復日", "Recovery day"],
      ["安全活動", "Safe movement"],
      ["活動複習", "Movement review"],
    ],
  }),
  buildUnit({
    unitNumber: 7,
    slug: "doctor-prep",
    zhTitle: "就診準備",
    enTitle: "Doctor Prep",
    zhDescription: "準備問題，不作診斷。",
    enDescription: "Prepare questions, not diagnosis.",
    icon: "stethoscope",
    unlocksQuestType: "doctor_prep",
    lessonTitles: [
      ["寫一條問題", "Write one question"],
      ["帶備資料", "Bring context"],
      ["紅旗先行", "Red flags first"],
      ["不作診斷", "Not diagnosis"],
      ["就診複習", "Doctor prep review"],
    ],
  }),
  buildUnit({
    unitNumber: 8,
    slug: "family-care",
    zhTitle: "家庭照顧基礎",
    enTitle: "Family Care Basics",
    zhDescription: "分享進度，不分享私隱細節。",
    enDescription: "Share progress, not private details.",
    icon: "users",
    unlocksQuestType: "health_review",
    lessonTitles: [
      ["家庭圈", "Family circle"],
      ["只分享完成", "Share completion only"],
      ["照顧者摘要", "Caregiver summary"],
      ["私隱同意", "Consent first"],
      ["家庭複習", "Family review"],
    ],
  }),
  buildUnit({
    unitNumber: 9,
    slug: "insurance-education",
    zhTitle: "保險教育",
    enTitle: "Insurance Education",
    zhDescription: "整理問題，不作保險建議。",
    enDescription: "Organize questions, not advice.",
    icon: "shield-check",
    unlocksQuestType: "learn",
    lessonTitles: [
      ["保險界線", "Insurance boundaries"],
      ["不作核保分數", "No underwriting score"],
      ["問題清單", "Question checklist"],
      ["保障問題清單", "Coverage question checklist"],
      ["保險複習", "Insurance review"],
    ],
  }),
];

export function findLessonTrack(trackSlug: string) {
  return lessonTracks.find((track) => track.slug === trackSlug) ?? null;
}

export function findLesson(trackSlug: string, lessonSlug?: string) {
  const track = findLessonTrack(trackSlug);
  if (!track) {
    return null;
  }

  return track.lessons.find((lesson) => lesson.slug === (lessonSlug ?? track.lessons[0]?.slug)) ?? null;
}

function buildUnit({
  unitNumber,
  slug,
  zhTitle,
  enTitle,
  zhDescription,
  enDescription,
  icon,
  unlocksQuestType,
  lessonTitles,
}: {
  unitNumber: number;
  slug: string;
  zhTitle: string;
  enTitle: string;
  zhDescription: string;
  enDescription: string;
  icon: string;
  unlocksQuestType: QuestType;
  lessonTitles: Array<[string, string]>;
}): LessonTrackContent {
  const baseLessons = lessonTitles.map(([zh, en], index) => lessonNode({
    slug: slugify(en),
    title: { zh, en },
    unitDescription: { zh: zhDescription, en: enDescription },
    kind: "lesson",
    orderIndex: index,
    unlocksQuestType,
  }));
  const practice = lessonNode({
    slug: "practice",
    title: { zh: "練習", en: "Practice" },
    unitDescription: { zh: zhDescription, en: enDescription },
    kind: "practice",
    orderIndex: 5,
    unlocksQuestType,
  });
  const review = lessonNode({
    slug: "review",
    title: { zh: "複習", en: "Review" },
    unitDescription: { zh: zhDescription, en: enDescription },
    kind: "review",
    orderIndex: 6,
    unlocksQuestType,
  });
  const boss = lessonNode({
    slug: "boss",
    title: { zh: "Boss 回顧", en: "Boss review" },
    unitDescription: { zh: zhDescription, en: enDescription },
    kind: "boss",
    orderIndex: 7,
    unlocksQuestType,
    xp: 15,
  });

  return {
    slug,
    unitNumber,
    title: { zh: zhTitle, en: enTitle },
    description: { zh: zhDescription, en: enDescription },
    icon,
    lessons: [...baseLessons, practice, review, boss],
  };
}

function lessonNode({
  slug,
  title,
  unitDescription,
  kind,
  orderIndex,
  unlocksQuestType,
  xp = kind === "boss" ? 15 : kind === "review" ? 10 : 5,
}: {
  slug: string;
  title: LocalizedText;
  unitDescription: LocalizedText;
  kind: LessonNodeKind;
  orderIndex: number;
  unlocksQuestType: QuestType;
  xp?: number;
}): LessonNodeContent {
  const questions = buildQuestions(title, unlocksQuestType);

  return {
    slug,
    title,
    kind,
    cards: [
      unitDescription,
      { zh: "今日只需要一個可以重複的小行動。", en: "Today only needs one repeatable tiny action." },
      unlocksQuestType === "learn" ? insuranceBoundary : genericBoundary,
    ],
    quiz: {
      question: questions[0].question,
      answers: questions[0].answers,
      correctAnswerId: questions[0].correctAnswerId,
    },
    questions,
    xp,
    orderIndex,
    unlocksQuestType,
  };
}

function buildQuestions(title: LocalizedText, unlocksQuestType: QuestType): LessonQuestion[] {
  const safetyQuestion: LessonQuestion = {
    id: "safe-choice",
    type: unlocksQuestType === "doctor_prep" ? "scenario_choice" : "multiple_choice",
    question: { zh: `${title.zh} 最安全嘅做法係？`, en: `What is the safest way to use ${title.en}?` },
    answers: [
      { id: "a", text: { zh: "追求完美，一次做晒", en: "Aim for perfect and do everything at once" } },
      { id: "b", text: { zh: "揀一個溫和小步，唔舒服就停", en: "Pick one gentle step and pause if unwell" } },
      { id: "c", text: { zh: "用結果判斷自己健康好壞", en: "Use the result to judge health worth" } },
    ],
    correctAnswerId: "b",
    explanation: { zh: "健康任務獎勵安全、可重複的小步。", en: "Health Quest rewards safe, repeatable tiny steps." },
  };

  const boundaryQuestion: LessonQuestion = unlocksQuestType === "learn"
    ? {
      id: "insurance-boundary",
      type: "true_false",
      question: { zh: "健康任務 XP 會改善保險資格或索償結果。", en: "Health Quest XP improves insurance eligibility or claim outcomes." },
      answers: [
        { id: "true", text: { zh: "正確", en: "True" } },
        { id: "false", text: { zh: "不正確", en: "False" } },
      ],
      correctAnswerId: "false",
      explanation: insuranceBoundary,
    }
    : {
      id: "urgent-boundary",
      type: "scenario_choice",
      question: { zh: "如果出現緊急或危急情況，應該點做？", en: "What should happen in an urgent or emergency situation?" },
      answers: [
        { id: "a", text: { zh: "先完成任務攞 XP", en: "Complete quests for XP first" } },
        { id: "b", text: { zh: "立即致電 999 或前往急症室", en: "Call 999 or go to Accident & Emergency now" } },
        { id: "c", text: { zh: "等 AI 確認先行動", en: "Wait for AI confirmation first" } },
      ],
      correctAnswerId: "b",
      explanation: genericBoundary,
    };

  return [safetyQuestion, boundaryQuestion];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
