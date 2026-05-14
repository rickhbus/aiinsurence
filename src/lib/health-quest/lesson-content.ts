import type { LocalizedText, QuestType } from "./types";

export type LessonQuiz = {
  question: LocalizedText;
  answers: Array<{ id: string; text: LocalizedText }>;
  correctAnswerId: string;
};

export type LessonNodeContent = {
  slug: string;
  title: LocalizedText;
  cards: LocalizedText[];
  quiz: LessonQuiz;
  xp: number;
  unlocksQuestType?: QuestType;
};

export type LessonTrackContent = {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  lessons: LessonNodeContent[];
};

const genericBoundary = {
  zh: "如情況嚴重、持續或令你擔心，請尋求醫護協助；緊急情況請致電 999 或前往急症室。",
  en: "If anything is severe, persistent, or worrying, seek medical help; for emergencies call 999 or go to Accident & Emergency.",
};

export const lessonTracks: LessonTrackContent[] = [
  {
    slug: "hydration-basics",
    title: { zh: "補水基礎", en: "Hydration Basics" },
    description: { zh: "由一杯水開始。", en: "Start with one glass." },
    icon: "droplets",
    lessons: [
      {
        slug: "start-with-one-glass",
        title: { zh: "由一杯水開始", en: "Start with one glass" },
        cards: [
          { zh: "每個人需要嘅水分都唔同，但細小習慣更容易持續。", en: "Hydration needs vary, but tiny routines are easier to repeat." },
          { zh: "簡單開始：起身後或食飯時飲一杯水。", en: "A simple start is one glass after waking or with meals." },
          { zh: "如果有嚴重頭暈、神志不清、暈倒或嚴重脫水症狀，請尋求醫護協助。", en: "If you feel severe dizziness, confusion, fainting, or severe dehydration symptoms, seek medical help." },
        ],
        quiz: {
          question: { zh: "邊個係溫和嘅補水習慣？", en: "Which is a gentle hydration habit?" },
          answers: [
            { id: "a", text: { zh: "強迫自己飲極大量水", en: "Force extreme water intake" } },
            { id: "b", text: { zh: "起身後飲一杯水", en: "Drink one glass after waking" } },
            { id: "c", text: { zh: "成日忽略口渴", en: "Ignore thirst all day" } },
          ],
          correctAnswerId: "b",
        },
        xp: 5,
        unlocksQuestType: "water",
      },
    ],
  },
  track("sleep-reset", "睡眠重置", "Sleep Reset", "一個睡前小步。", "One tiny wind-down step.", "sleep_prep"),
  track("stress-reset", "壓力重置", "Stress Reset", "一般生活支援，不是診斷。", "General support, not diagnosis.", "mood"),
  track("mood-awareness", "心情覺察", "Mood Awareness", "用表情符號開始。", "Start with one emoji.", "mood"),
  track("food-awareness", "飲食覺察", "Food Awareness", "不羞辱、不計分。", "No shame, no moral scoring.", "meal"),
  track("movement-starter", "郁動入門", "Movement Starter", "恢復都算數。", "Recovery counts too.", "movement"),
  track("gym-safety", "健身安全", "Gym Safety", "不聲稱運動一定安全。", "No claim that exercise is medically safe.", "recovery"),
  track("doctor-visit-prep", "就診準備", "Doctor Visit Prep", "準備問題，不作診斷。", "Prepare questions, not diagnosis.", "doctor_prep"),
  track("insurance-education", "保險教育", "Insurance Education", "整理問題，不作建議。", "Organize questions, not advice.", "learn"),
  track("family-care-basics", "家庭照顧基礎", "Family Care Basics", "分享進度，不分享私隱。", "Share progress, not private details.", "health_review"),
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

function track(
  slug: string,
  zhTitle: string,
  enTitle: string,
  zhDescription: string,
  enDescription: string,
  unlocksQuestType: QuestType,
): LessonTrackContent {
  return {
    slug,
    title: { zh: zhTitle, en: enTitle },
    description: { zh: zhDescription, en: enDescription },
    icon: "book",
    lessons: [
      {
        slug: "tiny-start",
        title: { zh: "最細開始", en: "Tiny start" },
        cards: [
          { zh: zhDescription, en: enDescription },
          { zh: "今日只需要一個可以重複的小行動。", en: "Today only needs one repeatable tiny action." },
          genericBoundary,
        ],
        quiz: {
          question: { zh: "健康任務最重視咩？", en: "What does Health Quest reward most?" },
          answers: [
            { id: "a", text: { zh: "完美健康", en: "Perfect health" } },
            { id: "b", text: { zh: "一致性和安全小步", en: "Consistency and safe tiny steps" } },
            { id: "c", text: { zh: "忽略休息日", en: "Ignoring recovery days" } },
          ],
          correctAnswerId: "b",
        },
        xp: 5,
        unlocksQuestType,
      },
    ],
  };
}
