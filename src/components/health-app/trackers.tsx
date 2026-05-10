"use client";

import {
  Activity,
  Apple,
  BedDouble,
  Dumbbell,
  Footprints,
  HeartPulse,
  Plus,
  Timer,
  Waves,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  foodRecommendations,
  gymVolumeData,
  paceTrendData,
  weeklyNutritionData,
  workoutTemplates,
} from "@/lib/health-app/mock-data";
import { label, text, ui } from "@/lib/health-app/i18n";
import type { HealthPage, Locale, LocalizedText } from "@/lib/health-app/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FoodRecommendationCard,
  GymProgressCard,
  NutritionCard,
  RunningProgressCard,
  SafetyDisclaimer,
  SleepCard,
  WaterCard,
  WorkoutTemplateCard,
} from "./dashboard-cards";
import { MuscleGroupChart, ProgressChart } from "./charts";

export function TrackOverviewPage({ locale }: { locale: Locale }) {
  const cards: Array<{ title: LocalizedText; href: string; icon: LucideIcon; body: LocalizedText }> = [
    { title: ui.running, href: "/track/running", icon: Footprints, body: { zh: "距離、配速、RPE 和下一次跑步建議。", en: "Distance, pace, RPE, and next-run suggestions." } },
    { title: ui.gym, href: "/track/gym", icon: Dumbbell, body: { zh: "模板、動作、容量、恢復地圖。", en: "Templates, exercises, volume, and recovery map." } },
    { title: ui.body, href: "/track/body", icon: HeartPulse, body: { zh: "體重、腰圍和身體趨勢。", en: "Weight, waist, and body trends." } },
    { title: ui.sleep, href: "/track/sleep", icon: BedDouble, body: { zh: "睡眠時間、質素和恢復提醒。", en: "Sleep hours, quality, and recovery reminders." } },
    { title: ui.water, href: "/track/water", icon: Waves, body: { zh: "飲水進度和香港濕熱天提醒。", en: "Hydration progress and humid Hong Kong reminders." } },
    { title: ui.sports, href: "/track/sports", icon: Activity, body: { zh: "球類、游泳、瑜伽或其他活動。", en: "Ball sports, swimming, yoga, and other activities." } },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.track}
        description={{
          zh: "所有活動紀錄都會成為 AI 建議的背景，但只會在你同意後保存到健康記憶。",
          en: "All logs can inform AI recommendations, but health memory is saved only with consent.",
        }}
        locale={locale}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.href} className="bg-card/80 shadow-sm">
            <CardHeader>
              <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                <card.icon aria-hidden="true" />
              </span>
              <CardTitle>{text(card.title, locale)}</CardTitle>
              <CardDescription>{text(card.body, locale)}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href={card.href}>{locale === "zh-Hant" ? "開啟" : "Open"}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RunningPage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.running}
        description={{
          zh: "循序漸進地建立跑量，避免過度訓練並留意傷患訊號。",
          en: "Build volume gradually, avoid overtraining, and watch injury signals.",
        }}
        locale={locale}
      />

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <QuickAddRunForm locale={locale} />
        <div className="grid gap-5 lg:grid-cols-2">
          <RunningProgressCard locale={locale} />
          <RunningStatsCard locale={locale} />
          <Card className="bg-card/80 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>{locale === "zh-Hant" ? "配速趨勢" : "Pace trend"}</CardTitle>
              <CardDescription>
                {locale === "zh-Hant" ? "數字越低代表配速越快，仍應以恢復為先。" : "Lower is faster, but recovery still comes first."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressChart data={paceTrendData} variant="line" height={220} />
            </CardContent>
          </Card>
        </div>
      </div>

      <AITrainingLogicCard
        locale={locale}
        title={{ zh: "AI 下一次跑步建議", en: "AI next-run recommendation" }}
        points={[
          {
            zh: "如果昨日跑得辛苦，今天用步行、伸展或輕鬆單車恢復。",
            en: "If yesterday’s run was hard, recover today with walking, stretching, or easy cycling.",
          },
          {
            zh: "如果連續兩週穩定，下一週跑量最多小幅增加，避免進取加量。",
            en: "If two weeks are consistent, increase next week only slightly; avoid aggressive volume jumps.",
          },
          {
            zh: "每次包含熱身和冷卻；膝部尖銳痛楚或惡化應停止並尋求專業評估。",
            en: "Include warm-up and cool-down; stop and seek professional care if knee pain is sharp or worsening.",
          },
        ]}
      />
    </div>
  );
}

export function GymPage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.gym}
        description={{
          zh: "記錄動作、組數、重量和 RPE，讓 AI 安全地建議漸進超負荷。",
          en: "Log exercises, sets, load, and RPE so AI can suggest progressive overload safely.",
        }}
        locale={locale}
      />

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <ExerciseLogForm locale={locale} />
        <div className="grid gap-5 lg:grid-cols-2">
          <GymProgressCard locale={locale} />
          <Card className="bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle>{locale === "zh-Hant" ? "肌群分佈" : "Muscle group balance"}</CardTitle>
              <CardDescription>
                {locale === "zh-Hant" ? "平衡推、拉、腿、核心和恢復日。" : "Balance push, pull, legs, core, and recovery."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MuscleGroupChart data={gymVolumeData} />
            </CardContent>
          </Card>
          <Card className="bg-card/80 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>{locale === "zh-Hant" ? "訓練模板" : "Workout templates"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {workoutTemplates.map((template) => (
                <WorkoutTemplateCard key={template} template={template} locale={locale} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <AITrainingLogicCard
        locale={locale}
        title={{ zh: "AI 漸進超負荷建議", en: "AI progressive overload suggestion" }}
        points={[
          {
            zh: "只在姿勢穩定、RPE 合理、恢復足夠時加重量或次數。",
            en: "Add load or reps only when form is stable, RPE is reasonable, and recovery is adequate.",
          },
          {
            zh: "酸痛肌群可改做輕量活動或訓練其他部位。",
            en: "For sore muscles, use light activity or train another area.",
          },
          {
            zh: "尖銳痛楚、頭暈、胸痛或嚴重氣促時停止並尋求醫療協助。",
            en: "Stop and seek medical help for sharp pain, dizziness, chest pain, or severe breathlessness.",
          },
        ]}
      />
    </div>
  );
}

export function NutritionPage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.nutrition}
        description={{
          zh: "不極端節食，用簡單食物交換和香港友善選擇改善能量與蛋白質。",
          en: "No extreme dieting; use simple swaps and Hong Kong-friendly choices for energy and protein.",
        }}
        locale={locale}
      />

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <FoodLogForm locale={locale} />
        <div className="grid gap-5 lg:grid-cols-2">
          <NutritionCard locale={locale} />
          <WaterCard locale={locale} />
          <Card className="bg-card/80 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>{locale === "zh-Hant" ? "每週營養趨勢" : "Weekly nutrition trend"}</CardTitle>
              <CardDescription>
                {locale === "zh-Hant" ? "卡路里與蛋白質走勢，避免危險低熱量。" : "Calories and protein trend, avoiding unsafe restriction."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressChart data={weeklyNutritionData} variant="bar" height={220} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>{locale === "zh-Hant" ? "食物建議" : "Food recommendations"}</CardTitle>
          <CardDescription>
            {locale === "zh-Hant"
              ? "根據目標、偏好、過敏、預算和近期紀錄生成。"
              : "Based on goals, preferences, allergies, budget, and recent logs."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {foodRecommendations.map((item) => (
            <FoodRecommendationCard key={item.title.en} item={item} locale={locale} />
          ))}
        </CardContent>
      </Card>

      <SafetyDisclaimer locale={locale} />
    </div>
  );
}

export function GenericTrackerPage({ page, locale }: { page: HealthPage; locale: Locale }) {
  const copy: Record<string, { title: LocalizedText; description: LocalizedText; icon: LucideIcon }> = {
    walking: { title: ui.walking, description: { zh: "用步行維持恢復日活動量。", en: "Use walking to keep recovery-day activity up." }, icon: Footprints },
    sports: { title: ui.sports, description: { zh: "記錄游泳、球類、瑜伽或其他運動。", en: "Track swimming, ball sports, yoga, or other activities." }, icon: Activity },
    body: { title: ui.body, description: { zh: "體重、腰圍和身體變化應看長期趨勢。", en: "Weight, waist, and body change are best read as long-term trends." }, icon: HeartPulse },
    sleep: { title: ui.sleep, description: { zh: "睡眠質素會影響訓練和食慾。", en: "Sleep quality affects training and appetite." }, icon: BedDouble },
    water: { title: ui.water, description: { zh: "香港濕熱天更要留意補水和電解質訊號。", en: "In humid Hong Kong weather, watch hydration and electrolyte cues." }, icon: Waves },
    "food-log": { title: ui.foodLog, description: { zh: "快速記錄一餐或小食。", en: "Quickly log a meal or snack." }, icon: Apple },
    "diet-plan": { title: ui.dietPlan, description: { zh: "用安全、均衡、可持續的方法規劃飲食。", en: "Plan food in a safe, balanced, sustainable way." }, icon: Apple },
  };
  const selected = copy[page] ?? copy.body;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={selected.title} description={selected.description} locale={locale} />
      <Card className="bg-card/80 shadow-sm">
        <CardHeader>
          <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <selected.icon aria-hidden="true" />
          </span>
          <CardTitle>{locale === "zh-Hant" ? "新紀錄" : "New log"}</CardTitle>
          <CardDescription>{label(ui.emptyState, locale)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input placeholder={locale === "zh-Hant" ? "標題 / 數值" : "Title / value"} />
          <Input placeholder={locale === "zh-Hant" ? "時間 / 數量" : "Time / amount"} />
          <Button>
            <Plus data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "新增" : "Add"}
          </Button>
        </CardContent>
      </Card>
      <SpecificTrackerPanel page={page} locale={locale} />
      {page === "sleep" ? <SleepCard locale={locale} /> : null}
      {page === "water" ? <WaterCard locale={locale} /> : null}
    </div>
  );
}

function SpecificTrackerPanel({ page, locale }: { page: HealthPage; locale: Locale }) {
  if (page === "sleep") {
    return (
      <Card className="bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>{locale === "zh-Hant" ? "睡眠詳情" : "Sleep details"}</CardTitle>
          <CardDescription>{locale === "zh-Hant" ? "記錄睡眠時間、質素和作息一致性。" : "Track sleep hours, quality, and schedule consistency."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <FormInput label={{ zh: "睡眠小時", en: "Sleep hours" }} locale={locale} placeholder="7.2" />
          <FormInput label={{ zh: "睡眠質素 1-10", en: "Sleep quality 1-10" }} locale={locale} placeholder="8" />
          <FormInput label={{ zh: "一致性", en: "Consistency" }} locale={locale} placeholder="22:45 - 06:45" />
          <FormInput label={{ zh: "上床時間", en: "Bedtime" }} locale={locale} placeholder="22:45" />
          <FormInput label={{ zh: "起床時間", en: "Wake time" }} locale={locale} placeholder="06:45" />
          <div className="rounded-lg bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant"
              ? "AI 睡眠建議：今晚先把睡前手機時間縮短 15 分鐘。"
              : "AI sleep suggestion: reduce late phone time by 15 minutes tonight."}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (page === "water") {
    return (
      <Card className="bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>{locale === "zh-Hant" ? "飲水目標" : "Hydration goal"}</CardTitle>
          <CardDescription>{locale === "zh-Hant" ? "快速新增 250ml、500ml 或自訂飲水量。" : "Quick add 250ml, 500ml, or a custom amount."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr]">
          <Button variant="outline">250ml</Button>
          <Button variant="outline">500ml</Button>
          <Input placeholder={locale === "zh-Hant" ? "自訂 ml" : "Custom ml"} aria-label={locale === "zh-Hant" ? "自訂飲水量" : "Custom water amount"} />
          <div className="rounded-lg bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
            {locale === "zh-Hant" ? "今日目標 3.0L，連續 5 日達標。" : "Daily goal 3.0L, 5-day hydration streak."}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (page === "body") {
    return (
      <Card className="bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>{locale === "zh-Hant" ? "身體指標趨勢" : "Body metrics trend"}</CardTitle>
          <CardDescription>{locale === "zh-Hant" ? "看長期趨勢，不被單日波動影響。" : "Read long-term trends, not single-day changes."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="grid gap-3">
            <FormInput label={{ zh: "體重 kg", en: "Weight kg" }} locale={locale} placeholder="72.4" />
            <FormInput label={{ zh: "腰圍 cm", en: "Waist cm" }} locale={locale} placeholder="82" />
            <FormInput label={{ zh: "體脂（可選）", en: "Body fat optional" }} locale={locale} placeholder="18%" />
            <label className="grid gap-2 text-sm font-medium">
              {locale === "zh-Hant" ? "備註" : "Notes"}
              <Textarea placeholder={locale === "zh-Hant" ? "例如：早上空腹量度。" : "Example: measured fasted in the morning."} />
            </label>
          </div>
          <ProgressChart
            data={[
              { label: "W1", value: 73.1 },
              { label: "W2", value: 72.8 },
              { label: "W3", value: 72.6 },
              { label: "W4", value: 72.4 },
            ]}
            variant="line"
            height={220}
          />
        </CardContent>
      </Card>
    );
  }

  return null;
}

function QuickAddRunForm({ locale }: { locale: Locale }) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{locale === "zh-Hant" ? "快速新增跑步" : "Quick add run"}</CardTitle>
        <CardDescription>{locale === "zh-Hant" ? "記錄足夠資料，方便下次安全加量。" : "Log enough detail for safe progression next time."}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <FormInput label={{ zh: "距離 km", en: "Distance km" }} locale={locale} placeholder="5.0" />
        <FormInput label={{ zh: "時間", en: "Duration" }} locale={locale} placeholder="00:31:00" />
        <FormInput label={{ zh: "配速", en: "Pace" }} locale={locale} placeholder="6:12/km" />
        <FormInput label={{ zh: "卡路里", en: "Calories" }} locale={locale} placeholder="380" />
        <FormInput label={{ zh: "平均心率", en: "Avg heart rate" }} locale={locale} placeholder="145" />
        <FormInput label={{ zh: "RPE 難度 1-10", en: "RPE difficulty 1-10" }} locale={locale} placeholder="6" />
        <FormInput label={{ zh: "天氣", en: "Weather" }} locale={locale} placeholder={locale === "zh-Hant" ? "潮濕" : "Humid"} />
        <FormInput label={{ zh: "跑鞋", en: "Shoe" }} locale={locale} placeholder="Daily trainer" />
        <label className="grid gap-2 text-sm font-medium">
          {locale === "zh-Hant" ? "路線與備註" : "Route notes"}
          <Textarea placeholder={locale === "zh-Hant" ? "例如：海濱輕鬆跑，右膝無不適。" : "Example: easy harbourfront run, no knee discomfort."} />
        </label>
      </CardContent>
      <CardFooter>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "新增跑步" : "Add run"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ExerciseLogForm({ locale }: { locale: Locale }) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{locale === "zh-Hant" ? "動作記錄" : "Exercise log"}</CardTitle>
        <CardDescription>{locale === "zh-Hant" ? "記錄 RPE 讓 AI 避免過度建議。" : "Log RPE so AI avoids overreaching."}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <FormInput label={{ zh: "動作", en: "Exercise" }} locale={locale} placeholder="Lat pulldown" />
        <Select>
          <SelectTrigger className="w-full" aria-label={locale === "zh-Hant" ? "肌群" : "Muscle group"}>
            <SelectValue placeholder={locale === "zh-Hant" ? "選擇肌群" : "Select muscle group"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{locale === "zh-Hant" ? "肌群" : "Muscle group"}</SelectLabel>
              {["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Mobility"].map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label={{ zh: "組數", en: "Sets" }} locale={locale} placeholder="3" />
          <FormInput label={{ zh: "次數", en: "Reps" }} locale={locale} placeholder="10" />
          <FormInput label={{ zh: "重量 kg", en: "Weight kg" }} locale={locale} placeholder="40" />
          <FormInput label={{ zh: "休息秒數", en: "Rest seconds" }} locale={locale} placeholder="90" />
        </div>
        <FormInput label={{ zh: "RPE", en: "RPE" }} locale={locale} placeholder="7" />
        <label className="grid gap-2 text-sm font-medium">
          {locale === "zh-Hant" ? "備註" : "Notes"}
          <Textarea placeholder={locale === "zh-Hant" ? "姿勢、痛楚、恢復狀態..." : "Form, pain, recovery status..."} />
        </label>
      </CardContent>
      <CardFooter>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "新增動作" : "Add exercise"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function FoodLogForm({ locale }: { locale: Locale }) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{locale === "zh-Hant" ? "飲食記錄" : "Food log"}</CardTitle>
        <CardDescription>{locale === "zh-Hant" ? "不需要完美，先記錄大概即可。" : "It does not need to be perfect; start with useful estimates."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meal">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meal">{locale === "zh-Hant" ? "餐點" : "Meal"}</TabsTrigger>
            <TabsTrigger value="water">{locale === "zh-Hant" ? "飲水" : "Water"}</TabsTrigger>
          </TabsList>
          <TabsContent value="meal" className="mt-4 grid gap-3">
            <Select>
              <SelectTrigger className="w-full" aria-label={locale === "zh-Hant" ? "餐類" : "Meal type"}>
                <SelectValue placeholder={locale === "zh-Hant" ? "選擇餐類" : "Select meal type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
                    <SelectItem key={meal} value={meal}>
                      {meal}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FormInput label={{ zh: "食物名稱", en: "Food name" }} locale={locale} placeholder={locale === "zh-Hant" ? "雞飯少汁加菜" : "Chicken rice, less sauce"} />
            <div className="grid grid-cols-2 gap-3">
              <FormInput label={{ zh: "卡路里", en: "Calories" }} locale={locale} placeholder="560" />
              <FormInput label={{ zh: "蛋白質 g", en: "Protein g" }} locale={locale} placeholder="34" />
              <FormInput label={{ zh: "碳水 g", en: "Carbs g" }} locale={locale} placeholder="72" />
              <FormInput label={{ zh: "脂肪 g", en: "Fat g" }} locale={locale} placeholder="14" />
              <FormInput label={{ zh: "纖維 g", en: "Fiber g" }} locale={locale} placeholder="6" />
              <FormInput label={{ zh: "糖 g", en: "Sugar g" }} locale={locale} placeholder="5" />
              <FormInput label={{ zh: "鈉 mg", en: "Sodium mg" }} locale={locale} placeholder="760" />
              <FormInput label={{ zh: "飲水 ml", en: "Water ml" }} locale={locale} placeholder="500" />
            </div>
            <label className="grid gap-2 text-sm font-medium">
              {locale === "zh-Hant" ? "相片上載（佔位）與備註" : "Photo upload placeholder and notes"}
              <Textarea placeholder={locale === "zh-Hant" ? "相片功能接駁儲存後啟用。" : "Photo support can be wired to storage later."} />
            </label>
          </TabsContent>
          <TabsContent value="water" className="mt-4 grid gap-3">
            <FormInput label={{ zh: "飲水 ml", en: "Water ml" }} locale={locale} placeholder="500" />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "新增飲食" : "Add food"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function RunningStatsCard({ locale }: { locale: Locale }) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{locale === "zh-Hant" ? "跑步紀錄" : "Running stats"}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Stat value="5:56/km" label={locale === "zh-Hant" ? "最佳配速" : "Best pace"} />
        <Stat value="5.0 km" label={locale === "zh-Hant" ? "最長跑" : "Longest run"} />
        <Stat value="3" label={locale === "zh-Hant" ? "本週跑步" : "Runs this week"} />
        <Stat value="5 days" label={locale === "zh-Hant" ? "連續紀錄" : "Running streak"} />
      </CardContent>
    </Card>
  );
}

function AITrainingLogicCard({
  locale,
  title,
  points,
}: {
  locale: Locale;
  title: LocalizedText;
  points: LocalizedText[];
}) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{text(title, locale)}</CardTitle>
        <CardDescription>
          {locale === "zh-Hant" ? "安全規則會優先於表現目標。" : "Safety rules take priority over performance goals."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {points.map((point) => (
          <div key={point.en} className="rounded-lg bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
            {text(point, locale)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FormInput({ label: itemLabel, locale, placeholder }: { label: LocalizedText; locale: Locale; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {text(itemLabel, locale)}
      <Input placeholder={placeholder} />
    </label>
  );
}

function Stat({ value, label: statLabel }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-muted/45 p-3">
      <p className="flex items-center gap-2 text-lg font-semibold tracking-normal">
        <Timer aria-hidden="true" />
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{statLabel}</p>
    </div>
  );
}

function PageHeader({ title, description, locale }: { title: LocalizedText; description: LocalizedText; locale: Locale }) {
  return (
    <section className="rounded-xl border bg-card/70 p-5 shadow-sm backdrop-blur-md">
      <p className="text-sm text-muted-foreground">{text(ui.appNameFull, locale)}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-normal">{text(title, locale)}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{text(description, locale)}</p>
    </section>
  );
}
