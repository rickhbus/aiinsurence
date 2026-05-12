import type {
  DailyLogContext,
  GymWorkoutContext,
  HydrationContext,
  MealContext,
  MoodLogContext,
  ToiletContext,
} from "./types";

export type DoctorReportInput = {
  generatedAt?: string;
  dailyLogs?: Array<DailyLogContext & { logDate?: string | null }>;
  moodLogs?: Array<MoodLogContext & { loggedAt?: string | null }>;
  meals?: Array<MealContext & { mealTime?: string | null }>;
  hydrationLogs?: Array<HydrationContext & { loggedAt?: string | null }>;
  toiletLogs?: Array<ToiletContext & { loggedAt?: string | null }>;
  gymWorkouts?: Array<GymWorkoutContext & { createdAt?: string | null }>;
};

export type DoctorReport = {
  titleZh: string;
  generatedAt: string;
  timeline: string[];
  dailyContext: string[];
  redFlags: string[];
  questionsToAsk: string[];
  whatToBring: string[];
  disclaimerZh: string;
  printableHtml: string;
};

const disclaimerZh =
  "這份摘要只用作覆診前整理資料，不作診斷、治療、法律或保險建議；如有嚴重、持續或突然惡化情況，請立即致電 999 或前往急症室。";

export function buildDoctorReport(input: DoctorReportInput): DoctorReport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const timeline = buildTimeline(input);
  const dailyContext = buildDailyContext(input);
  const redFlags = buildRedFlags(input);
  const reportWithoutHtml = {
    titleZh: "醫生覆診摘要 / Doctor visit summary",
    generatedAt,
    timeline,
    dailyContext,
    redFlags,
    questionsToAsk: [
      "這些不適可能需要做甚麼檢查？",
      "甚麼情況需要即時去急症室？",
      "運動、飲食、睡眠或藥物方面有沒有需要暫停或調整？",
      "何時需要覆診，或需要轉介到哪一科？",
    ],
    whatToBring: [
      "身份證明、覆診紙、現有藥物或補充劑清單。",
      "近期檢查報告、影像、出院紙或轉介信。",
      "保險卡或保單資料，如有需要索取收據或醫療報告。",
      "這份摘要，以及想問醫生的問題。",
    ],
    disclaimerZh,
  };

  return {
    ...reportWithoutHtml,
    printableHtml: renderDoctorReportHtml(reportWithoutHtml),
  };
}

function buildTimeline(input: DoctorReportInput) {
  const rows = [
    ...(input.dailyLogs ?? []).map((log) => compactLine(log.logDate, [
      log.bodyNotes ? `身體備註：${log.bodyNotes}` : null,
      log.todayGoal ? `今日目標：${log.todayGoal}` : null,
    ])),
    ...(input.moodLogs ?? []).map((log) => compactLine(log.loggedAt, [
      log.userText ? `心情記錄：${log.userText}` : null,
      log.emotionLabel ? `情緒標籤：${log.emotionLabel}` : null,
    ])),
    ...(input.meals ?? []).map((meal) => compactLine(meal.mealTime, [
      meal.description ? `飲食：${meal.description}` : null,
      meal.estimatedCalories != null ? `約 ${meal.estimatedCalories} kcal` : null,
    ])),
    ...(input.toiletLogs ?? []).map((log) => compactLine(log.loggedAt, [
      log.notes ? `腸胃/小便備註：${log.notes}` : null,
      log.urineColor ? `尿色：${log.urineColor}` : null,
      log.stoolType != null ? `大便形態：${log.stoolType}` : null,
    ])),
    ...(input.gymWorkouts ?? []).map((workout) => compactLine(workout.createdAt ?? workout.workoutDate, [
      workout.workoutType ? `運動：${workout.workoutType}` : null,
      workout.durationMinutes != null ? `${workout.durationMinutes} 分鐘` : null,
      workout.notes ? `備註：${workout.notes}` : null,
    ])),
  ].filter(Boolean);

  return rows.length > 0 ? rows.slice(0, 24) : ["未有近期文字備註。"];
}

function buildDailyContext(input: DoctorReportInput) {
  const latestDaily = input.dailyLogs?.[0];
  const hydrationTotal = (input.hydrationLogs ?? []).reduce((total, log) => total + (log.waterMl ?? 0), 0);
  const workouts = input.gymWorkouts?.length ?? 0;

  return [
    latestDaily?.sleepMinutes != null ? `最近睡眠：${latestDaily.sleepMinutes} 分鐘。` : "最近睡眠：未有足夠記錄。",
    latestDaily?.moodScore != null ? `最近心情分：${latestDaily.moodScore}/10。` : "最近心情分：未有足夠記錄。",
    hydrationTotal > 0 ? `最近補水總量：${hydrationTotal} ml。` : "最近補水：未有足夠記錄。",
    `近期運動記錄：${workouts} 次。`,
    `近期飲食記錄：${input.meals?.length ?? 0} 餐。`,
  ];
}

function buildRedFlags(input: DoctorReportInput) {
  const flags = new Set<string>();

  for (const log of input.toiletLogs ?? []) {
    if (log.bloodFlag || log.urineColor === "brown_red_pink") {
      flags.add("曾記錄血尿、血便或啡紅尿色，需要向醫護人員確認。");
    }

    if (log.painFlag || log.feverFlag) {
      flags.add("曾記錄痛楚或發燒，若嚴重或持續請盡快求醫。");
    }
  }

  for (const workout of input.gymWorkouts ?? []) {
    if (workout.painFlag || (workout.redFlagSymptoms?.length ?? 0) > 0) {
      flags.add("運動記錄曾出現痛楚或紅旗症狀，未確認前不要硬撐訓練。");
    }
  }

  for (const mood of input.moodLogs ?? []) {
    if (mood.safetyFlag) {
      flags.add("心情記錄曾出現安全提示；如有自傷、即時危險或失控風險，請立即求助。");
    }
  }

  return flags.size > 0
    ? Array.from(flags)
    : ["未見已記錄紅旗；但嚴重、突然或持續惡化的不適仍應求醫。"];
}

function compactLine(date: string | null | undefined, parts: Array<string | null>) {
  const content = parts.filter(Boolean).join("；");

  if (!content) {
    return "";
  }

  return `${date ? formatDate(date) : "未記日期"} - ${content}`;
}

function renderDoctorReportHtml(report: Omit<DoctorReport, "printableHtml">) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.titleZh)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; margin: 32px; color: #111827; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 28px; }
    ul { padding-left: 22px; }
    li { margin: 6px 0; }
    .disclaimer { border: 1px solid #f59e0b; background: #fffbeb; padding: 12px 14px; border-radius: 8px; }
    @media print { body { margin: 18mm; } button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Print / 列印</button>
  <h1>${escapeHtml(report.titleZh)}</h1>
  <p>Generated: ${escapeHtml(formatDate(report.generatedAt))}</p>
  ${renderSection("症狀 / 備註時間線", report.timeline)}
  ${renderSection("睡眠、心情、飲食、補水、運動背景", report.dailyContext)}
  ${renderSection("紅旗提示", report.redFlags)}
  ${renderSection("想問醫生的問題", report.questionsToAsk)}
  ${renderSection("要帶文件", report.whatToBring)}
  <h2>安全聲明</h2>
  <p class="disclaimer">${escapeHtml(report.disclaimerZh)}</p>
</body>
</html>`;
}

function renderSection(title: string, items: string[]) {
  return `<h2>${escapeHtml(title)}</h2><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-Hant-HK");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
