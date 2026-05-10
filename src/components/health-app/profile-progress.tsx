"use client";

import type { User } from "@supabase/supabase-js";
import { BarChart3, DatabaseZap, Download, LockKeyhole, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { demoUser, goals, memoryItems, activityData, gymVolumeData, weeklyNutritionData } from "@/lib/health-app/mock-data";
import { label, text, ui } from "@/lib/health-app/i18n";
import type { Locale, LocalizedText, MemoryCategory } from "@/lib/health-app/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/user-memory";
import { GoalCard, SafetyDisclaimer } from "./dashboard-cards";
import { ProgressChart } from "./charts";

export function ProgressPage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.progress}
        description={{
          zh: "把跑步、健身、營養、睡眠和飲水放在同一份週報中。",
          en: "Bring running, gym, nutrition, sleep, and hydration into one weekly report.",
        }}
        locale={locale}
      />

      <Card className="bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>{label(ui.weeklyReport, locale)}</CardTitle>
          <CardDescription>
            {locale === "zh-Hant"
              ? "本週你完成 3 次訓練、跑了 12.3km、4 天蛋白質表現改善，並維持 5 天飲水連續紀錄。最大改善位是睡眠一致性。"
              : "This week you completed 3 workouts, ran 12.3km, improved protein intake on 4 days, and kept a 5-day water streak. The main improvement area is sleep consistency."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-3">
          <TrendCard title={{ zh: "活動", en: "Activity" }} value="64,300" detail={{ zh: "本週步數", en: "steps this week" }} locale={locale} />
          <TrendCard title={{ zh: "跑步", en: "Running" }} value="12.3 km" detail={{ zh: "穩定建立跑量", en: "steady volume build" }} locale={locale} />
          <TrendCard title={{ zh: "營養", en: "Nutrition" }} value="108g" detail={{ zh: "平均蛋白質", en: "avg protein" }} locale={locale} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartPanel title={{ zh: "活動趨勢", en: "Activity trend" }} data={activityData} locale={locale} />
        <ChartPanel title={{ zh: "健身容量", en: "Gym volume" }} data={gymVolumeData} locale={locale} variant="bar" />
        <ChartPanel title={{ zh: "營養趨勢", en: "Nutrition trend" }} data={weeklyNutritionData} locale={locale} variant="bar" />
        <Card className="bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "AI 總結" : "AI summary"}</CardTitle>
            <CardDescription>
              {locale === "zh-Hant"
                ? "你正在建立可持續的節奏。下週先守住睡眠和蛋白質，再微調跑量。"
                : "You are building a sustainable rhythm. Next week, protect sleep and protein before nudging run volume."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { zh: "最好表現：飲水與跑步一致性。", en: "Best: hydration and running consistency." },
              { zh: "主要風險：連續高強度日可能增加膝部不適。", en: "Main risk: repeated hard days may increase knee discomfort." },
              { zh: "下一步：一個恢復日、一個全身力量日、一個輕鬆跑。", en: "Next: one recovery day, one full-body strength day, one easy run." },
            ].map((item) => (
              <div key={item.en} className="rounded-lg bg-muted/45 p-3 text-sm text-muted-foreground">
                {text(item, locale)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function GoalsPage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.goals}
        description={{
          zh: "目標會轉成每週行動，並由 AI 按恢復和安全性調整。",
          en: "Goals become weekly actions, with AI adjustments based on recovery and safety.",
        }}
        locale={locale}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} locale={locale} />
        ))}
      </div>
      <Card className="bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>{locale === "zh-Hant" ? "新增目標" : "New goal"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input placeholder={locale === "zh-Hant" ? "目標類型" : "Goal type"} />
          <Input placeholder={locale === "zh-Hant" ? "目標值" : "Target"} />
          <Input placeholder={locale === "zh-Hant" ? "期限" : "Deadline"} />
          <Button>{locale === "zh-Hant" ? "建立" : "Create"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfilePage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.profile}
        description={{
          zh: "管理語言、地區、健康目標、營養偏好、醫療備註和照護偏好。",
          en: "Manage language, region, health goals, nutrition preferences, medical notes, and care preference.",
        }}
        locale={locale}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "個人設定" : "Profile settings"}</CardTitle>
            <CardDescription>{locale === "zh-Hant" ? "示範資料可接駁 Supabase profiles。" : "Demo data can be wired to Supabase profiles."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <ProfileField label={{ zh: "名稱", en: "Name" }} value={demoUser.displayName} locale={locale} />
            <ProfileField label={ui.language} value={text(demoUser.language, locale)} locale={locale} />
            <ProfileField label={{ zh: "地區", en: "Region" }} value={text(demoUser.location, locale)} locale={locale} />
            <ProfileField label={{ zh: "主要目標", en: "Primary goal" }} value={text(demoUser.goal, locale)} locale={locale} />
            <ProfileField label={{ zh: "健身程度", en: "Fitness level" }} value={text(demoUser.fitnessLevel, locale)} locale={locale} />
            <ProfileField label={{ zh: "照護偏好", en: "Care preference" }} value={text(demoUser.carePreference, locale)} locale={locale} />
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {locale === "zh-Hant" ? "醫療備註" : "Medical notes"}
              <Textarea defaultValue={locale === "zh-Hant" ? "跑步時偶爾膝部不適。這不是診斷。" : "Occasional knee discomfort while running. This is not a diagnosis."} />
            </label>
          </CardContent>
        </Card>
        <PrivacySettingsPanel locale={locale} />
      </div>
    </div>
  );
}

export function MemoryPage({ locale }: { locale: Locale }) {
  const grouped = useMemo(() => {
    return memoryItems.reduce<Record<MemoryCategory, typeof memoryItems>>(
      (groups, item) => {
        groups[item.category].push(item);
        return groups;
      },
      { profile: [], fitness: [], nutrition: [], healthcare: [], insurance: [], behavior: [] },
    );
  }, []);

  const categoryLabels: Record<MemoryCategory, LocalizedText> = {
    profile: { zh: "個人記憶", en: "Profile memory" },
    fitness: { zh: "健身記憶", en: "Fitness memory" },
    nutrition: { zh: "營養記憶", en: "Nutrition memory" },
    healthcare: { zh: "醫療記憶", en: "Healthcare memory" },
    insurance: { zh: "保險記憶", en: "Insurance memory" },
    behavior: { zh: "行為記憶", en: "Behavior memory" },
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.memory}
        description={{
          zh: "所有已保存健康記憶都可查看、編輯和刪除。未經同意不保存。",
          en: "All saved health memories can be viewed, edited, and deleted. Nothing is saved without consent.",
        }}
        locale={locale}
      />
      {(Object.keys(grouped) as MemoryCategory[]).map((category) => (
        <Card key={category} className="bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>{text(categoryLabels[category], locale)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {grouped[category].map((item) => (
              <Card key={item.id} className="bg-background/60">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span>{text(item.title, locale)}</span>
                    <Badge variant="secondary">{text(categoryLabels[item.category], locale)}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {text(item.source, locale)} · {locale === "zh-Hant" ? "建立日期" : "Created"}: {item.updatedAt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{text(item.content, locale)}</p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm">{locale === "zh-Hant" ? "編輯" : "Edit"}</Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 data-icon="inline-start" aria-hidden="true" />
                    {locale === "zh-Hant" ? "刪除" : "Delete"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SettingsPage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={ui.settings}
        description={{
          zh: "控制健康記憶、資料匯出、刪除記憶、帳戶刪除佔位和同意紀錄。",
          en: "Control health memory, data export, memory deletion, account deletion placeholder, and consent history.",
        }}
        locale={locale}
      />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <PrivacySettingsPanel locale={locale} />
        <Card className="bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "同意紀錄" : "Consent history"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { zh: "健康記憶：已開啟", en: "Health memory: on" },
              { zh: "行銷訊息：關閉", en: "Marketing: off" },
              { zh: "顧問交接：未啟用", en: "Adviser handoff: not enabled" },
            ].map((item) => (
              <div key={item.en} className="flex items-center justify-between rounded-lg bg-muted/45 p-3 text-sm">
                <span>{text(item, locale)}</span>
                <Badge variant="secondary">2026-05-11</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <SafetyDisclaimer locale={locale} />
    </div>
  );
}

export function AuthLandingPage({ locale }: { locale: Locale }) {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        title={ui.auth}
        description={{
          zh: "支援匿名模式、電郵 magic link，Google 登入可在 Supabase 設定後啟用。",
          en: "Supports anonymous mode and email magic link. Google sign-in can be enabled in Supabase.",
        }}
        locale={locale}
      />
      <AuthPanel
        supabase={supabase}
        user={user}
        onUserReady={setUser}
        onProfileReady={handleProfileReady}
      />
    </div>
  );
}

function handleProfileReady(_profile: Profile) {
  return _profile;
}

export function PrivacySettingsPanel({ locale }: { locale: Locale }) {
  const [memoryOn, setMemoryOn] = useState(true);

  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <LockKeyhole aria-hidden="true" />
        </span>
        <CardTitle>{label(ui.privacyConsent, locale)}</CardTitle>
        <CardDescription>
          {locale === "zh-Hant"
            ? "健康記憶只會在同意後保存，可匯出、刪除或關閉。"
            : "Health memory is saved only with consent, and can be exported, deleted, or turned off."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <button
          type="button"
          className="flex min-h-12 items-center justify-between rounded-lg border bg-background px-3 text-left"
          onClick={() => setMemoryOn((current) => !current)}
          aria-pressed={memoryOn}
        >
          <span className="flex items-center gap-2">
            <DatabaseZap aria-hidden="true" />
            {locale === "zh-Hant" ? "健康記憶" : "Health memory"}
          </span>
          <Badge variant={memoryOn ? "default" : "secondary"}>
            {memoryOn ? (locale === "zh-Hant" ? "開啟" : "On") : (locale === "zh-Hant" ? "關閉" : "Off")}
          </Badge>
        </button>
        <Button variant="outline" className="justify-start">
          <Download data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "匯出資料" : "Export data"}
        </Button>
        <Button variant="outline" className="justify-start">
          <Trash2 data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "刪除健康記憶" : "Delete memory"}
        </Button>
        <Button variant="destructive" className="justify-start">
          <Trash2 data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "刪除帳戶（佔位）" : "Delete account placeholder"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ChartPanel({
  title,
  data,
  locale,
  variant,
}: {
  title: LocalizedText;
  data: Array<{ label: string; value: number; secondary?: number }>;
  locale: Locale;
  variant?: "area" | "bar" | "line";
}) {
  return (
    <Card className="bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{text(title, locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressChart data={data} variant={variant} height={220} />
      </CardContent>
    </Card>
  );
}

function TrendCard({ title, value, detail, locale }: { title: LocalizedText; value: string; detail: LocalizedText; locale: Locale }) {
  return (
    <div className="rounded-lg bg-muted/45 p-4">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <BarChart3 aria-hidden="true" />
        {text(title, locale)}
      </div>
      <p className="text-2xl font-semibold tracking-normal">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text(detail, locale)}</p>
    </div>
  );
}

function ProfileField({ label: fieldLabel, value, locale }: { label: LocalizedText; value: string; locale: Locale }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {text(fieldLabel, locale)}
      <Input defaultValue={value} />
    </label>
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
