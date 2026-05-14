import type { Lesson, LocalizedText } from "./types";

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

export const suggestedPrompts: LocalizedText[] = [
  { zh: "講簡單啲", en: "Make this easier" },
  { zh: "好似新手咁解釋", en: "Explain like I’m new" },
  { zh: "幫我準備睇醫生", en: "Doctor prep" },
  { zh: "保險基本概念", en: "Insurance basics" },
  { zh: "溫柔模式", en: "Gentle mode" },
  { zh: "推薦今日訓練", en: "Recommend a workout for today" },
  { zh: "減脂應該吃甚麼？", en: "What should I eat for fat loss?" },
  { zh: "建立今週健身計劃", en: "Create a gym plan for this week" },
  { zh: "用簡單方式解釋蛋白質", en: "Explain protein in simple terms" },
  { zh: "跑步膝蓋不適怎樣處理？", en: "What should I do about knee discomfort when running?" },
  { zh: "應該看普通科、專科或急症？", en: "Should I see a GP, specialist, or emergency care?" },
  { zh: "整理保險索償文件", en: "Organize insurance claim documents" },
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
