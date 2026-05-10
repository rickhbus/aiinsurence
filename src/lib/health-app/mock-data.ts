import type {
  CoachMessage,
  DemoUser,
  Goal,
  GymLog,
  Lesson,
  MacroDatum,
  MealLog,
  MemoryItem,
  MetricDatum,
  RunningLog,
  SleepLog,
} from "./types";

export const demoUser: DemoUser = {
  displayName: "市民健康",
  goal: {
    zh: "減脂並建立肌肉",
    en: "Lose fat and build muscle",
  },
  location: { zh: "香港", en: "Hong Kong" },
  language: { zh: "繁體中文及英文", en: "Traditional Chinese and English" },
  fitnessLevel: { zh: "初級至中級", en: "Beginner to intermediate" },
  carePreference: { zh: "公私營都可以", en: "Either public or private care" },
  foodPreference: {
    zh: "高蛋白、香港本地食物、少糖",
    en: "High protein, Hong Kong local food, less sugar",
  },
};

export const healthScore = {
  score: 84,
  explanation: {
    zh: "活動量、水分和蛋白質表現穩定；睡眠時間仍可更一致。",
    en: "Activity, hydration, and protein are steady; sleep timing can be more consistent.",
  },
};

export const runningLogs: RunningLog[] = [
  {
    id: "run-1",
    date: "Mon",
    distanceKm: 3.2,
    durationSeconds: 1140,
    pace: "5:56/km",
    calories: 245,
    heartRateAvg: 144,
    rpe: 6,
    routeNotes: "Tamar Park loop",
    weather: "Humid",
    shoe: "Daily trainer",
    notes: "Comfortable effort after warm-up.",
  },
  {
    id: "run-2",
    date: "Wed",
    distanceKm: 4.1,
    durationSeconds: 1560,
    pace: "6:20/km",
    calories: 318,
    heartRateAvg: 139,
    rpe: 5,
    routeNotes: "Harbourfront easy run",
    weather: "Light rain",
    shoe: "Daily trainer",
    notes: "Kept it easy after gym day.",
  },
  {
    id: "run-3",
    date: "Sat",
    distanceKm: 5.0,
    durationSeconds: 1810,
    pace: "6:02/km",
    calories: 395,
    heartRateAvg: 151,
    rpe: 7,
    routeNotes: "Park loop with 3 short strides",
    weather: "Warm",
    shoe: "Lightweight trainer",
    notes: "Harder finish, knees felt okay.",
  },
];

export const gymLogs: GymLog[] = [
  {
    id: "gym-1",
    date: "Tue",
    workout: "Upper / Lower",
    exerciseName: "Goblet squat",
    muscleGroup: "Legs",
    sets: 3,
    reps: 10,
    weightKg: 18,
    restSeconds: 90,
    rpe: 7,
    notes: "Good form, moderate effort.",
  },
  {
    id: "gym-2",
    date: "Tue",
    workout: "Upper / Lower",
    exerciseName: "Incline dumbbell press",
    muscleGroup: "Chest",
    sets: 3,
    reps: 9,
    weightKg: 16,
    restSeconds: 90,
    rpe: 7,
    notes: "One rep in reserve.",
  },
  {
    id: "gym-3",
    date: "Thu",
    workout: "Pull + core",
    exerciseName: "Lat pulldown",
    muscleGroup: "Back",
    sets: 4,
    reps: 8,
    weightKg: 42.5,
    restSeconds: 105,
    rpe: 8,
    notes: "Last set was challenging.",
  },
  {
    id: "gym-4",
    date: "Sun",
    workout: "Mobility and recovery",
    exerciseName: "Hip mobility circuit",
    muscleGroup: "Mobility",
    sets: 2,
    reps: 12,
    weightKg: 0,
    restSeconds: 45,
    rpe: 3,
    notes: "Recovery work after long run.",
  },
];

export const mealLogs: MealLog[] = [
  {
    id: "meal-1",
    date: "Mon",
    mealType: "Breakfast",
    foodName: "Greek yogurt, oats, berries",
    calories: 390,
    proteinG: 31,
    carbsG: 47,
    fatG: 9,
    fiberG: 8,
    sugarG: 13,
    sodiumMg: 115,
    waterMl: 350,
    notes: "High protein breakfast.",
  },
  {
    id: "meal-2",
    date: "Tue",
    mealType: "Lunch",
    foodName: "Chicken rice, less sauce, extra vegetables",
    calories: 610,
    proteinG: 43,
    carbsG: 72,
    fatG: 16,
    fiberG: 7,
    sugarG: 6,
    sodiumMg: 760,
    waterMl: 500,
    notes: "Hong Kong style swap.",
  },
  {
    id: "meal-3",
    date: "Wed",
    mealType: "Dinner",
    foodName: "Steamed fish, rice, choy sum",
    calories: 520,
    proteinG: 39,
    carbsG: 58,
    fatG: 12,
    fiberG: 6,
    sugarG: 4,
    sodiumMg: 540,
    waterMl: 450,
    notes: "Balanced light dinner.",
  },
  {
    id: "meal-4",
    date: "Fri",
    mealType: "Snack",
    foodName: "Unsweetened soy milk and boiled egg",
    calories: 230,
    proteinG: 20,
    carbsG: 12,
    fatG: 11,
    fiberG: 2,
    sugarG: 4,
    sodiumMg: 210,
    waterMl: 300,
    notes: "Post-gym protein.",
  },
  {
    id: "meal-5",
    date: "Sun",
    mealType: "Lunch",
    foodName: "Fish soup noodles, less oil",
    calories: 560,
    proteinG: 34,
    carbsG: 80,
    fatG: 10,
    fiberG: 5,
    sugarG: 5,
    sodiumMg: 890,
    waterMl: 500,
    notes: "Choose unsweetened tea.",
  },
];

export const sleepLogs: SleepLog[] = [
  { id: "sleep-1", date: "Mon", hours: 6.7, quality: 7, notes: "Late screen time." },
  { id: "sleep-2", date: "Tue", hours: 7.2, quality: 8, notes: "Good wind-down." },
  { id: "sleep-3", date: "Wed", hours: 6.3, quality: 6, notes: "Woke once." },
  { id: "sleep-4", date: "Thu", hours: 7.5, quality: 8, notes: "Consistent bedtime." },
  { id: "sleep-5", date: "Fri", hours: 6.9, quality: 7, notes: "Light recovery." },
];

export const waterData: MetricDatum[] = [
  { label: "Mon", value: 1900 },
  { label: "Tue", value: 2200 },
  { label: "Wed", value: 1800 },
  { label: "Thu", value: 2400 },
  { label: "Fri", value: 2100 },
  { label: "Sat", value: 2600 },
  { label: "Sun", value: 2300 },
];

export const activityData: MetricDatum[] = [
  { label: "Mon", value: 8200, secondary: 32 },
  { label: "Tue", value: 9600, secondary: 48 },
  { label: "Wed", value: 7300, secondary: 28 },
  { label: "Thu", value: 10500, secondary: 55 },
  { label: "Fri", value: 6800, secondary: 24 },
  { label: "Sat", value: 12800, secondary: 62 },
  { label: "Sun", value: 9100, secondary: 35 },
];

export const runningDistanceData: MetricDatum[] = runningLogs.map((run) => ({
  label: run.date,
  value: run.distanceKm,
}));

export const paceTrendData: MetricDatum[] = [
  { label: "W1", value: 6.4 },
  { label: "W2", value: 6.25 },
  { label: "W3", value: 6.18 },
  { label: "W4", value: 6.08 },
];

export const gymVolumeData: MetricDatum[] = [
  { label: "Chest", value: 864 },
  { label: "Back", value: 1360 },
  { label: "Legs", value: 540 },
  { label: "Core", value: 220 },
  { label: "Mobility", value: 120 },
];

export const macroData: MacroDatum[] = [
  { name: "Protein", value: 34, fill: "var(--chart-1)" },
  { name: "Carbs", value: 46, fill: "var(--chart-2)" },
  { name: "Fat", value: 20, fill: "var(--chart-3)" },
];

export const weeklyNutritionData: MetricDatum[] = [
  { label: "Mon", value: 1540, secondary: 92 },
  { label: "Tue", value: 1810, secondary: 111 },
  { label: "Wed", value: 1680, secondary: 104 },
  { label: "Thu", value: 1725, secondary: 118 },
  { label: "Fri", value: 1660, secondary: 97 },
  { label: "Sat", value: 1880, secondary: 122 },
  { label: "Sun", value: 1710, secondary: 108 },
];

export const goals: Goal[] = [
  {
    id: "goal-1",
    type: { zh: "跑 5K", en: "Run 5K" },
    target: "5 km under 31:00",
    deadline: "2026-06-30",
    weeklyActions: [
      { zh: "每週 2 次輕鬆跑", en: "Two easy runs per week" },
      { zh: "一次短節奏訓練", en: "One short tempo session" },
    ],
    progress: 72,
    suggestion: {
      zh: "下週只增加約 8% 距離，並保留一日恢復。",
      en: "Increase distance by about 8% next week and keep one recovery day.",
    },
  },
  {
    id: "goal-2",
    type: { zh: "建立健身習慣", en: "Build gym habit" },
    target: "3 workouts / week",
    deadline: "2026-06-15",
    weeklyActions: [
      { zh: "一推、一拉、一腿或全身", en: "One push, one pull, one legs or full-body day" },
      { zh: "每次記錄 RPE", en: "Log RPE every session" },
    ],
    progress: 66,
    suggestion: {
      zh: "先穩定動作，再小幅增加重量或次數。",
      en: "Stabilize technique before adding a small amount of load or reps.",
    },
  },
  {
    id: "goal-3",
    type: { zh: "增加蛋白質", en: "Eat more protein" },
    target: "110g / day",
    deadline: "2026-05-31",
    weeklyActions: [
      { zh: "早餐加入高蛋白食物", en: "Add protein at breakfast" },
      { zh: "外食選少糖飲品", en: "Choose unsweetened drinks when eating out" },
    ],
    progress: 81,
    suggestion: {
      zh: "午餐可加入雞、魚、豆腐、蛋或希臘乳酪。",
      en: "Add chicken, fish, tofu, eggs, or Greek yogurt at lunch.",
    },
  },
];

export const lessons: Lesson[] = [
  {
    slug: "progressive-overload",
    title: { zh: "甚麼是漸進超負荷？", en: "What is progressive overload?" },
    category: { zh: "健身基礎", en: "Fitness basics" },
    difficulty: { zh: "初級", en: "Beginner" },
    explanation: {
      zh: "漸進超負荷是慢慢增加訓練難度，讓身體有時間適應。",
      en: "Progressive overload means slowly increasing training difficulty so your body can adapt.",
    },
    example: {
      zh: "今週臥推 40kg 做 8 下，下週可嘗試 40kg 做 9 下或 42.5kg 做 8 下。",
      en: "If you bench 40kg for 8 reps this week, next week you may try 40kg for 9 reps or 42.5kg for 8 reps.",
    },
    actionStep: {
      zh: "選一個動作，本週只進步一小步。",
      en: "Choose one exercise and improve by one small step this week.",
    },
    quizQuestion: {
      zh: "如果姿勢變差，是否仍應每次都加重量？",
      en: "Should you increase weight every workout if your form is poor?",
    },
    relatedTracker: { zh: "健身記錄", en: "Gym log" },
  },
  {
    slug: "cardio-zones",
    title: { zh: "心肺區間怎樣用？", en: "How do cardio zones work?" },
    category: { zh: "健身基礎", en: "Fitness basics" },
    difficulty: { zh: "初級", en: "Beginner" },
    explanation: {
      zh: "不同強度訓練不同能力；大部分跑步可保持輕鬆可說話的強度。",
      en: "Different intensities train different systems; most runs can stay easy enough to talk.",
    },
    example: {
      zh: "輕鬆跑能累積耐力，間歇跑應較少量並安排恢復。",
      en: "Easy runs build endurance; intervals should be lower volume with recovery.",
    },
    actionStep: { zh: "下次跑步先用 10 分鐘熱身。", en: "Start your next run with a 10-minute warm-up." },
    quizQuestion: { zh: "每次跑步都全力跑是否最好？", en: "Is it best to run all-out every time?" },
    relatedTracker: { zh: "跑步記錄", en: "Running log" },
  },
  {
    slug: "protein-simple",
    title: { zh: "蛋白質的簡單理解", en: "Protein in simple terms" },
    category: { zh: "營養", en: "Nutrition" },
    difficulty: { zh: "初級", en: "Beginner" },
    explanation: {
      zh: "蛋白質幫助肌肉修復和飽腹感，但仍需配合碳水、脂肪和蔬菜。",
      en: "Protein supports muscle repair and fullness, but still works best with carbs, fats, and vegetables.",
    },
    example: { zh: "雞、魚、蛋、豆腐、希臘乳酪都可成為一餐蛋白質來源。", en: "Chicken, fish, eggs, tofu, and Greek yogurt can all anchor a meal." },
    actionStep: { zh: "下一餐先選一份掌心大小蛋白質。", en: "Choose one palm-sized protein source at your next meal." },
    quizQuestion: { zh: "只吃蛋白質、不吃其他食物是否健康？", en: "Is eating only protein healthy?" },
    relatedTracker: { zh: "飲食記錄", en: "Food log" },
  },
  {
    slug: "hydration",
    title: { zh: "補水不只是飲很多水", en: "Hydration is more than drinking a lot" },
    category: { zh: "營養", en: "Nutrition" },
    difficulty: { zh: "初級", en: "Beginner" },
    explanation: {
      zh: "補水需要配合天氣、出汗量、運動和尿液顏色觀察。",
      en: "Hydration depends on weather, sweat, exercise, and urine color cues.",
    },
    example: { zh: "香港潮濕天跑步後，可補水並留意是否頭暈或抽筋。", en: "After humid Hong Kong runs, hydrate and notice dizziness or cramps." },
    actionStep: { zh: "今天用水瓶分三段完成飲水。", en: "Use a bottle and split today’s water into three blocks." },
    quizQuestion: { zh: "口渴時才飲水是否永遠足夠？", en: "Is drinking only when thirsty always enough?" },
    relatedTracker: { zh: "飲水記錄", en: "Water log" },
  },
  {
    slug: "when-gp",
    title: { zh: "何時先看普通科？", en: "When should you see a GP first?" },
    category: { zh: "醫療導航", en: "Healthcare navigation" },
    difficulty: { zh: "初級", en: "Beginner" },
    explanation: {
      zh: "非緊急、原因未明或需要初步檢查時，普通科可協助分流和轉介。",
      en: "For non-urgent, unclear symptoms or initial checks, a GP can triage and refer.",
    },
    example: { zh: "皮膚痕兩星期，可先帶相片和誘因紀錄看普通科。", en: "For two weeks of itching, bring photos and trigger notes to a GP." },
    actionStep: { zh: "求醫前寫下症狀、開始時間、誘因和用過的藥物。", en: "Before a visit, note symptoms, start date, triggers, and medicines tried." },
    quizQuestion: { zh: "胸痛和氣促是否應等待普通科預約？", en: "Should chest pain with breathlessness wait for a GP appointment?" },
    relatedTracker: { zh: "醫療導航", en: "Healthcare routing" },
  },
  {
    slug: "ae-red-flags",
    title: { zh: "急症室警號", en: "A&E red flags" },
    category: { zh: "醫療導航", en: "Healthcare navigation" },
    difficulty: { zh: "重要", en: "Important" },
    explanation: {
      zh: "胸痛、嚴重呼吸困難、中風徵兆、嚴重過敏、昏迷或大量出血需要即時急症處理。",
      en: "Chest pain, severe breathing difficulty, stroke signs, severe allergy, unconsciousness, or severe bleeding needs urgent care.",
    },
    example: { zh: "突然一邊身無力或口齒不清，請立即致電 999。", en: "Sudden one-sided weakness or slurred speech: call 999 immediately." },
    actionStep: { zh: "把緊急警號加入家庭照護清單。", en: "Add red flags to your household care checklist." },
    quizQuestion: { zh: "嚴重過敏是否應先問保險？", en: "Should severe allergy wait for insurance confirmation?" },
    relatedTracker: { zh: "症狀路由", en: "Symptom routing" },
  },
  {
    slug: "hospital-insurance",
    title: { zh: "住院保險看甚麼？", en: "How to read hospital insurance" },
    category: { zh: "保險教育", en: "Insurance education" },
    difficulty: { zh: "基礎", en: "Foundational" },
    explanation: {
      zh: "留意病房級別、墊底費、等候期、不保事項、網絡和索償文件。",
      en: "Look at room class, deductible, waiting periods, exclusions, network, and claim documents.",
    },
    example: { zh: "同一保障額在不同病房級別可能有不同自付風險。", en: "The same benefit limit can mean different out-of-pocket risk by room class." },
    actionStep: { zh: "列出三條要問保險公司的問題。", en: "List three questions to ask your insurer." },
    quizQuestion: { zh: "保險教育是否等於推薦產品？", en: "Is insurance education the same as product recommendation?" },
    relatedTracker: { zh: "保單助手", en: "Policy helper" },
  },
  {
    slug: "claim-documents",
    title: { zh: "索償文件準備", en: "Claim document preparation" },
    category: { zh: "保險教育", en: "Insurance education" },
    difficulty: { zh: "基礎", en: "Foundational" },
    explanation: {
      zh: "一般要保留收據、診斷/醫療報告、轉介信、出院紙、化驗或影像報告。",
      en: "Commonly keep receipts, medical reports, referral letters, discharge summaries, and test or imaging reports.",
    },
    example: { zh: "門診後即時拍低收據，並問診所可否補發醫療證明。", en: "After outpatient care, photograph receipts and ask if medical certificates can be reissued." },
    actionStep: { zh: "建立一個索償文件資料夾。", en: "Create a folder for claim documents." },
    quizQuestion: { zh: "AI 能否保證索償成功？", en: "Can AI guarantee a successful claim?" },
    relatedTracker: { zh: "保單助手", en: "Policy helper" },
  },
];

export const memoryItems: MemoryItem[] = [
  {
    id: "mem-1",
    category: "profile",
    title: { zh: "地區與語言", en: "Region and language" },
    content: { zh: "香港；偏好繁體中文及英文。", en: "Hong Kong; prefers Traditional Chinese and English." },
    source: { zh: "初始設定", en: "Onboarding" },
    consentStatus: "saved",
    updatedAt: "2026-05-11",
  },
  {
    id: "mem-2",
    category: "fitness",
    title: { zh: "跑步膝部提示", en: "Running knee note" },
    content: { zh: "跑步時偶爾膝部不適，偏好循序漸進。", en: "Occasional knee discomfort while running; prefers gradual progression." },
    source: { zh: "使用者確認", en: "User confirmed" },
    consentStatus: "saved",
    updatedAt: "2026-05-11",
  },
  {
    id: "mem-3",
    category: "nutrition",
    title: { zh: "飲食偏好", en: "Food preference" },
    content: { zh: "高蛋白、香港本地食物、少糖。", en: "High protein, Hong Kong local food, less sugar." },
    source: { zh: "目標設定", en: "Goal setup" },
    consentStatus: "saved",
    updatedAt: "2026-05-11",
  },
  {
    id: "mem-4",
    category: "healthcare",
    title: { zh: "醫療偏好", en: "Care preference" },
    content: { zh: "可接受公營或私營，先理解合理下一步。", en: "Open to public or private care; wants a reasonable next step first." },
    source: { zh: "使用者確認", en: "User confirmed" },
    consentStatus: "saved",
    updatedAt: "2026-05-11",
  },
  {
    id: "mem-5",
    category: "behavior",
    title: { zh: "提醒風格", en: "Reminder style" },
    content: { zh: "喜歡短、實用、不誇張的提示。", en: "Likes short, practical reminders without hype." },
    source: { zh: "AI 教練互動", en: "AI coach interaction" },
    consentStatus: "saved",
    updatedAt: "2026-05-11",
  },
];

export const coachMessages: CoachMessage[] = [
  {
    role: "assistant",
    content: {
      zh: "今日建議：做 30 分鐘上半身力量訓練，午餐加一份蛋白質，晚上把睡前滑手機時間縮短 15 分鐘。",
      en: "Today’s recommendation: do 30 minutes of upper-body strength, add one protein serving at lunch, and shorten late screen time by 15 minutes.",
    },
  },
  {
    role: "assistant",
    content: {
      zh: "原因：你昨日跑得較用力，今天不需要再加跑量。保持活動但讓膝部和小腿恢復。",
      en: "Why: yesterday’s run was harder, so today does not need more run volume. Stay active while letting knees and calves recover.",
    },
  },
];

export const suggestedPrompts = [
  { zh: "推薦今日訓練", en: "Recommend a workout for today" },
  { zh: "減脂應該吃甚麼？", en: "What should I eat for fat loss?" },
  { zh: "建立今週健身計劃", en: "Create a gym plan for this week" },
  { zh: "用簡單方式解釋蛋白質", en: "Explain protein in simple terms" },
  { zh: "跑步膝痛要留意甚麼？", en: "I have knee pain when running, what should I consider?" },
  { zh: "我應該看普通科、專科還是急症？", en: "Should I go to a GP, specialist, or emergency care?" },
  { zh: "幫我理解保險保障", en: "Help me understand my insurance coverage" },
];

export const foodRecommendations = [
  {
    title: { zh: "高蛋白早餐", en: "High-protein breakfast" },
    body: {
      zh: "希臘乳酪加燕麥和莓果，或無糖豆漿加雞蛋。適合減脂時保持飽腹感。",
      en: "Greek yogurt with oats and berries, or unsweetened soy milk with eggs. Helpful for fullness during fat loss.",
    },
  },
  {
    title: { zh: "香港式健康午餐", en: "Hong Kong-style healthy lunch" },
    body: {
      zh: "雞飯少汁加菜、魚湯米線少油、瘦肉粥加青菜，飲水或無糖茶。",
      en: "Chicken rice with less sauce and vegetables, fish soup noodles with less oil, lean congee with greens, water or unsweetened tea.",
    },
  },
  {
    title: { zh: "健身後一餐", en: "Post-gym meal" },
    body: {
      zh: "蒸魚、豆腐、雞蛋或雞胸，配飯和蔬菜。避免用極低卡路里補償訓練。",
      en: "Steamed fish, tofu, eggs, or chicken with rice and vegetables. Avoid extreme calorie restriction after training.",
    },
  },
];

export const workoutTemplates = [
  "Push / Pull / Legs",
  "Upper / Lower",
  "Full body",
  "Beginner strength",
  "Fat loss circuit",
  "Home workout",
  "Mobility and recovery",
];

export const redFlags = [
  { zh: "胸痛", en: "Chest pain" },
  { zh: "嚴重呼吸困難", en: "Severe breathing difficulty" },
  { zh: "中風徵兆", en: "Stroke signs" },
  { zh: "嚴重過敏反應", en: "Severe allergic reaction" },
  { zh: "大量出血", en: "Severe bleeding" },
  { zh: "失去知覺", en: "Loss of consciousness" },
  { zh: "嚴重頭部受傷", en: "Severe head injury" },
  { zh: "突發劇烈頭痛", en: "Sudden severe headache" },
  { zh: "自殺念頭", en: "Suicidal thoughts" },
  { zh: "嚴重腹痛", en: "Severe abdominal pain" },
  { zh: "高燒伴混亂", en: "High fever with confusion" },
  { zh: "單邊身體無力", en: "Weakness on one side of body" },
];
