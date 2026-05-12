"use client";

import type { User } from "@supabase/supabase-js";
import {
  BarChart3,
  DatabaseZap,
  LockKeyhole,
  LogOut,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { label, text, ui } from "@/lib/health-app/i18n";
import type { Locale, LocalizedText, MemoryCategory } from "@/lib/health-app/types";
import type { DashboardData, HealthMemoryRow } from "@/lib/health-data/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/user-memory";
import { GoalCard, SafetyDisclaimer } from "./dashboard-cards";
import { ProgressChart } from "./charts";

const emptyChartData: Array<{ label: string; value: number; secondary?: number }> = [];

export function ProgressPage({ locale }: { locale: Locale }) {
  const { data } = useRealDashboardData();
  const weekly = data?.weekly;
  const activityData = data?.charts.activity ?? emptyChartData;
  const gymVolumeData = data?.charts.gymVolume ?? emptyChartData;
  const weeklyNutritionData = data?.charts.nutrition ?? emptyChartData;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ui.progress}
        description={{
          zh: "把跑步、健身、營養、睡眠和飲水放在同一份週報中。",
          en: "Bring running, gym, nutrition, sleep, and hydration into one weekly report.",
        }}
        locale={locale}
      />

      <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>{label(ui.weeklyReport, locale)}</CardTitle>
          <CardDescription>
            {weekly
              ? locale === "zh-Hant"
                ? `本週跑步 ${weekly.running_distance_km}km，健身 ${weekly.gym_sessions} 次，蛋白質達標 ${weekly.protein_consistency_days} 天，飲水達標 ${weekly.water_goal_days} 天。`
                : `This week: ${weekly.running_distance_km}km running, ${weekly.gym_sessions} gym sessions, ${weekly.protein_consistency_days} protein-consistent days, and ${weekly.water_goal_days} water-goal days.`
              : locale === "zh-Hant"
                ? "尚未載入真實週報。新增紀錄後，這裡會顯示你的實際趨勢。"
                : "No real weekly report is loaded yet. Add records to show your actual trends here."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-3">
          <TrendCard title={{ zh: "活動", en: "Activity" }} value={`${weekly?.workout_days ?? 0}`} detail={{ zh: "本週活動日", en: "active days this week" }} locale={locale} />
          <TrendCard title={{ zh: "跑步", en: "Running" }} value={`${weekly?.running_distance_km ?? 0} km`} detail={{ zh: "真實跑量", en: "real running volume" }} locale={locale} />
          <TrendCard title={{ zh: "營養", en: "Nutrition" }} value={`${weekly?.protein_consistency_days ?? 0}/7`} detail={{ zh: "蛋白質達標日", en: "protein-consistent days" }} locale={locale} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel title={{ zh: "活動趨勢", en: "Activity trend" }} data={activityData} locale={locale} />
        <ChartPanel title={{ zh: "健身容量", en: "Gym volume" }} data={gymVolumeData} locale={locale} variant="bar" />
        <ChartPanel title={{ zh: "營養趨勢", en: "Nutrition trend" }} data={weeklyNutritionData} locale={locale} variant="bar" />
        <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "AI 總結" : "AI summary"}</CardTitle>
            <CardDescription>
              {weekly?.ai_summary ||
                (locale === "zh-Hant"
                  ? "有足夠真實紀錄後，週報總結會在這裡顯示。"
                  : "Weekly summary appears here after enough real records are available.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { zh: `活動日：${weekly?.workout_days ?? 0}`, en: `Active days: ${weekly?.workout_days ?? 0}` },
              { zh: `平均健康分：${weekly?.health_score_avg ?? 0}`, en: `Average health score: ${weekly?.health_score_avg ?? 0}` },
              { zh: "提示：只使用真實紀錄生成週報。", en: "Note: weekly reports are generated only from real records." },
            ].map((item) => (
              <div key={item.en} className="rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground ring-1 ring-border/40">
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
  const { data } = useRealDashboardData();
  const goals = data?.goals ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ui.goals}
        description={{
          zh: "目標會轉成每週行動，並由 AI 按恢復和安全性調整。",
          en: "Goals become weekly actions, with AI adjustments based on recovery and safety.",
        }}
        locale={locale}
      />
      {goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyPanel locale={locale} title={{ zh: "尚未有目標", en: "No goals yet" }} />
      )}
      <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
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
  const { data } = useRealDashboardData();
  const profile = data?.profile;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ui.profile}
        description={{
          zh: "管理語言、地區、健康目標、營養偏好、醫療備註和照護偏好。",
          en: "Manage language, region, health goals, nutrition preferences, medical notes, and care preference.",
        }}
        locale={locale}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{locale === "zh-Hant" ? "個人設定" : "Profile settings"}</CardTitle>
            <CardDescription>{locale === "zh-Hant" ? "只顯示已載入的 Supabase 個人資料。" : "Only loaded Supabase profile data is shown."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <ProfileField label={{ zh: "名稱", en: "Name" }} value={profile?.displayName ?? ""} locale={locale} />
            <ProfileField label={ui.language} value={profile?.preferredLanguage ?? ""} locale={locale} />
            <ProfileField label={{ zh: "地區", en: "Region" }} value={profile?.location ?? ""} locale={locale} />
            <ProfileField label={{ zh: "主要目標", en: "Primary goal" }} value={profile?.goal ?? ""} locale={locale} />
            <ProfileField label={{ zh: "健身程度", en: "Fitness level" }} value={profile?.fitnessLevel ?? ""} locale={locale} />
            <ProfileField label={{ zh: "照護偏好", en: "Care preference" }} value="" locale={locale} />
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {locale === "zh-Hant" ? "醫療備註" : "Medical notes"}
              <Textarea placeholder={locale === "zh-Hant" ? "尚未載入醫療備註" : "No medical notes loaded"} />
            </label>
          </CardContent>
        </Card>
        <PrivacySettingsPanel locale={locale} />
      </div>
    </div>
  );
}

export function MemoryPage({ locale }: { locale: Locale }) {
  const [remoteMemory, setRemoteMemory] = useState<HealthMemoryRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMemory() {
      try {
        const response = await fetch("/api/memory", {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as { memory: HealthMemoryRow[] };

        if (active) {
          setRemoteMemory(body.memory);
        }
      } catch {
        if (active) {
          setRemoteMemory([]);
        }
      }
    }

    loadMemory();

    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const mappedItems = remoteMemory
      ? remoteMemory.map((item) => ({
          id: item.id,
          category: item.memory_type,
          title: {
            zh: categoryTitle(item.memory_type, "zh-Hant"),
            en: categoryTitle(item.memory_type, "en"),
          },
          content: { zh: item.content, en: item.content },
          source: {
            zh: item.source === "coach_memory_confirmation" ? "AI 建議，使用者確認" : "使用者確認",
            en: item.source === "coach_memory_confirmation" ? "AI suggested, user confirmed" : "User confirmed",
          },
          consentStatus: item.consent_status === "deleted" ? "off" : "saved",
          updatedAt: item.updated_at.slice(0, 10),
        }))
      : [];
    const normalizedQuery = query.trim().toLowerCase();
    const filteredItems = mappedItems.filter((item) => {
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const content = `${text(item.title, locale)} ${text(item.content, locale)}`.toLowerCase();
      const matchesQuery = !normalizedQuery || content.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    return filteredItems.reduce<Record<MemoryCategory, typeof mappedItems>>(
      (groups, item) => {
        groups[item.category].push(item);
        return groups;
      },
      { profile: [], fitness: [], nutrition: [], healthcare: [], insurance: [], behavior: [] },
    );
  }, [categoryFilter, locale, query, remoteMemory]);

  const categoryLabels: Record<MemoryCategory, LocalizedText> = {
    profile: { zh: "個人記憶", en: "Profile memory" },
    fitness: { zh: "健身記憶", en: "Fitness memory" },
    nutrition: { zh: "營養記憶", en: "Nutrition memory" },
    healthcare: { zh: "醫療記憶", en: "Healthcare memory" },
    insurance: { zh: "保險記憶", en: "Insurance memory" },
    behavior: { zh: "行為記憶", en: "Behavior memory" },
  };
  const memoryItemCount = Object.values(grouped).reduce(
    (total, items) => total + items.length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ui.memory}
        description={{
          zh: "所有已保存健康記憶都可查看、編輯和刪除。未經同意不保存。",
          en: "All saved health memories can be viewed, edited, and deleted. Nothing is saved without consent.",
        }}
        locale={locale}
      />
      <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
        <CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_220px_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "zh-Hant" ? "搜尋健康記憶" : "Search health memory"}
            aria-label={locale === "zh-Hant" ? "搜尋健康記憶" : "Search health memory"}
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as MemoryCategory | "all")}
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label={locale === "zh-Hant" ? "記憶類別" : "Memory category"}
          >
            <option value="all">{locale === "zh-Hant" ? "全部類別" : "All categories"}</option>
            {(Object.keys(categoryLabels) as MemoryCategory[]).map((category) => (
              <option key={category} value={category}>
                {text(categoryLabels[category], locale)}
              </option>
            ))}
          </select>
          <Badge variant={remoteMemory ? "default" : "secondary"} className="h-10 justify-center">
            {remoteMemory
              ? locale === "zh-Hant" ? "真實資料" : "Real data"
              : locale === "zh-Hant" ? "未載入" : "Not loaded"}
          </Badge>
        </CardContent>
      </Card>
      {memoryItemCount === 0 ? (
        <EmptyPanel locale={locale} title={{ zh: "尚未有健康記憶", en: "No health memory yet" }} />
      ) : null}
      {memoryItemCount > 0 ? (Object.keys(grouped) as MemoryCategory[])
        .filter((category) => grouped[category].length > 0)
        .map((category) => (
        <Card key={category} className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{text(categoryLabels[category], locale)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {grouped[category].map((item) => (
              <Card key={item.id} className="border-border/40 bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-border/60 hover:shadow-sm">
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
                  {editingId === item.id ? (
                    <Textarea
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      aria-label={locale === "zh-Hant" ? "編輯健康記憶" : "Edit health memory"}
                    />
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">{text(item.content, locale)}</p>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  {editingId === item.id ? (
                    <Button
                      variant="default"
                      size="sm"
                      disabled={!remoteMemory}
                      onClick={() => saveMemoryEdit(item.id)}
                    >
                      {locale === "zh-Hant" ? "保存" : "Save"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!remoteMemory}
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingText(text(item.content, locale));
                      }}
                    >
                      {locale === "zh-Hant" ? "編輯" : "Edit"}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!remoteMemory}
                    onClick={() => deleteMemory(item.id)}
                  >
                    <Trash2 data-icon="inline-start" aria-hidden="true" />
                    {locale === "zh-Hant" ? "刪除" : "Delete"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>
      )) : null}
    </div>
  );

  async function saveMemoryEdit(id: string) {
    const response = await fetch("/api/memory", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id, content: editingText }),
    });

    if (!response.ok) {
      return;
    }

    const body = (await response.json()) as { memory: HealthMemoryRow };
    setRemoteMemory((current) =>
      current?.map((item) => (item.id === id ? body.memory : item)) ?? current,
    );
    setEditingId(null);
    setEditingText("");
  }

  async function deleteMemory(id: string) {
    const response = await fetch("/api/memory", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      return;
    }

    setRemoteMemory((current) => current?.filter((item) => item.id !== id) ?? current);
  }
}

function categoryTitle(category: MemoryCategory, locale: Locale) {
  const labels: Record<MemoryCategory, LocalizedText> = {
    profile: { zh: "個人記憶", en: "Profile memory" },
    fitness: { zh: "健身記憶", en: "Fitness memory" },
    nutrition: { zh: "營養記憶", en: "Nutrition memory" },
    healthcare: { zh: "醫療記憶", en: "Healthcare memory" },
    insurance: { zh: "保險記憶", en: "Insurance memory" },
    behavior: { zh: "行為記憶", en: "Behavior memory" },
  };

  return text(labels[category], locale);
}

export function SettingsPage({ locale }: { locale: Locale }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ui.settings}
        description={{
          zh: "控制健康記憶、帳戶登入狀態、刪除記憶和同意紀錄。",
          en: "Control health memory, account session state, memory deletion, and consent history.",
        }}
        locale={locale}
      />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <PrivacySettingsPanel locale={locale} />
        <div className="grid gap-5">
          <AccountSessionPanel locale={locale} />
          <MobileHealthSettingsPanel locale={locale} />
          <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
            <CardHeader>
              <CardTitle>{locale === "zh-Hant" ? "同意紀錄" : "Consent history"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                { zh: "健康記憶：已開啟", en: "Health memory: on" },
                { zh: "行銷訊息：關閉", en: "Marketing: off" },
                { zh: "顧問交接：未啟用", en: "Adviser handoff: not enabled" },
              ].map((item) => (
                <div key={item.en} className="flex items-center justify-between rounded-xl bg-muted/30 p-3 text-sm ring-1 ring-border/40">
                  <span>{text(item, locale)}</span>
                  <Badge variant="secondary">2026-05-11</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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

function useRealDashboardData() {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!supabase) {
        setData(null);
        return;
      }

      try {
        const accessToken = await getDashboardAccessToken(supabase);

        if (!accessToken) {
          if (active) {
            setData(null);
          }
          return;
        }

        const response = await fetch("/api/dashboard", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (active) {
            setData(null);
          }
          return;
        }

        const body = (await response.json()) as DashboardData;

        if (active) {
          setData(body);
        }
      } catch {
        if (active) {
          setData(null);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [supabase]);

  return { data };
}

async function getDashboardAccessToken(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
) {
  try {
    const currentSession = await supabase.auth.getSession();
    const existingToken = currentSession.data.session?.access_token;

    if (existingToken) {
      return existingToken;
    }

    const anonymousSession = await supabase.auth.signInAnonymously();

    return anonymousSession.data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function PrivacySettingsPanel({ locale }: { locale: Locale }) {
  const [memoryOn, setMemoryOn] = useState(true);

  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
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
          className="flex min-h-12 items-center justify-between rounded-xl border border-border/40 bg-background/50 px-3 text-left transition-all duration-200 hover:border-border/60 hover:shadow-sm"
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
        <Button asChild variant="outline" className="justify-start">
          <a href="/profile/memory">
            <DatabaseZap data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "管理已保存健康記憶" : "Manage saved health memory"}
          </a>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <a href="/profile/memory">
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "前往刪除健康記憶" : "Go delete health memory"}
          </a>
        </Button>
        <div className="rounded-xl bg-muted/30 p-3 text-sm leading-6 text-muted-foreground ring-1 ring-border/40">
          {locale === "zh-Hant"
            ? "完整資料匯出和帳戶刪除需要正式私隱流程、身份確認和恢復期，未在此 MVP 中提供一鍵操作。"
            : "Full data export and account deletion require a formal privacy workflow, identity confirmation, and recovery window; this MVP does not provide one-click account deletion."}
        </div>
      </CardContent>
    </Card>
  );
}

function MobileHealthSettingsPanel({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<"loading" | "connected" | "not-connected" | "unavailable">("loading");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/mobile-health/status", {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          if (active) {
            setStatus("unavailable");
          }
          return;
        }

        const body = (await response.json()) as {
          connectedPlatforms?: string[];
          lastSuccessfulSync?: string | null;
          consent?: { mobileHealthSync?: boolean };
        };

        if (!active) {
          return;
        }

        setPlatforms(body.connectedPlatforms ?? []);
        setLastSync(body.lastSuccessfulSync ?? null);
        setStatus(body.consent?.mobileHealthSync ? "connected" : "not-connected");
      } catch {
        if (active) {
          setStatus("unavailable");
        }
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
          <Smartphone aria-hidden="true" />
        </span>
        <CardTitle>{locale === "zh-Hant" ? "手機健康資料同步" : "Mobile health sync"}</CardTitle>
        <CardDescription>
          {locale === "zh-Hant"
            ? "Apple HealthKit 和 Android Health Connect 只能由原生 App 在裝置上逐項請求授權；網頁不會直接讀取。"
            : "Apple HealthKit and Android Health Connect require a native app to request per-type permission on device; the web app does not read them directly."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3 text-sm ring-1 ring-border/40">
          <span>{locale === "zh-Hant" ? "同步同意" : "Sync consent"}</span>
          <Badge variant={status === "connected" ? "default" : "secondary"}>
            {status === "loading"
              ? locale === "zh-Hant" ? "檢查中" : "Checking"
              : status === "connected"
                ? locale === "zh-Hant" ? "已啟用" : "Enabled"
                : locale === "zh-Hant" ? "未啟用" : "Not enabled"}
          </Badge>
        </div>
        <div className="rounded-xl bg-muted/30 p-3 text-sm leading-6 text-muted-foreground ring-1 ring-border/40">
          {locale === "zh-Hant"
            ? "首版只接受步數、活動熱量、跑步／運動摘要、睡眠、體重和心率摘要；不接收診斷、藥物、臨床紀錄、葡萄糖或高頻心率串流。"
            : "The first release accepts steps, active energy, workout/run summaries, sleep, body weight, and heart-rate summaries only; it does not ingest diagnoses, medications, clinical records, glucose, or raw high-frequency heart streams."}
        </div>
        <div className="grid gap-2 text-sm">
          <span className="text-muted-foreground">
            {locale === "zh-Hant" ? "已連接平台" : "Connected platforms"}
          </span>
          <span>{platforms.length > 0 ? platforms.join(", ") : locale === "zh-Hant" ? "未連接" : "None"}</span>
        </div>
        <div className="grid gap-2 text-sm">
          <span className="text-muted-foreground">
            {locale === "zh-Hant" ? "最後成功同步" : "Last successful sync"}
          </span>
          <span>{lastSync ?? (locale === "zh-Hant" ? "尚未同步" : "No sync yet")}</span>
        </div>
        <Button asChild variant="outline" className="justify-start">
          <a href="/onboarding">
            <Smartphone data-icon="inline-start" aria-hidden="true" />
            {locale === "zh-Hant" ? "更新手機同步偏好" : "Update mobile sync preference"}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountSessionPanel({ locale }: { locale: Locale }) {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [status, setStatus] = useState<"loading" | "signed-out" | "signed-in">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!supabase) {
        setStatus("signed-out");
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (active) {
        setStatus(data.user ? "signed-in" : "signed-out");
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function signOut() {
    if (!supabase) {
      setMessage(locale === "zh-Hant" ? "Supabase 尚未設定。" : "Supabase is not configured.");
      return;
    }

    setMessage(locale === "zh-Hant" ? "正在登出..." : "Signing out...");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    setStatus("signed-out");
    setMessage(locale === "zh-Hant" ? "已登出。" : "Signed out.");
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
          <UserRound aria-hidden="true" />
        </span>
        <CardTitle>{locale === "zh-Hant" ? "帳戶狀態" : "Account status"}</CardTitle>
        <CardDescription>
          {locale === "zh-Hant"
            ? "登入狀態只會由 Supabase Auth 管理。登出後，匿名帳戶可能無法在其他裝置取回。"
            : "Session state is managed by Supabase Auth. After sign-out, anonymous accounts may not be recoverable on another device."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3 text-sm ring-1 ring-border/40">
          <span>{locale === "zh-Hant" ? "目前狀態" : "Current state"}</span>
          <Badge variant={status === "signed-in" ? "default" : "secondary"}>
            {status === "loading"
              ? locale === "zh-Hant" ? "檢查中" : "Checking"
              : status === "signed-in"
                ? locale === "zh-Hant" ? "已登入" : "Signed in"
                : locale === "zh-Hant" ? "未登入" : "Signed out"}
          </Badge>
        </div>
        <Button variant="outline" className="justify-start" disabled={status !== "signed-in"} onClick={signOut}>
          <LogOut data-icon="inline-start" aria-hidden="true" />
          {locale === "zh-Hant" ? "登出" : "Sign out"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
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
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>{text(title, locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressChart data={data} variant={variant} height={220} />
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ title, locale }: { title: LocalizedText; locale: Locale }) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/72 shadow-sm backdrop-blur-xl">
      <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
        <strong className="text-foreground">{text(title, locale)}</strong>
        <span className="mt-1 block">
          {locale === "zh-Hant"
            ? "這個區域只會顯示真實 Supabase 資料；未載入時保持空狀態。"
            : "This area only shows real Supabase data and stays empty when nothing is loaded."}
        </span>
      </CardContent>
    </Card>
  );
}

function TrendCard({ title, value, detail, locale }: { title: LocalizedText; value: string; detail: LocalizedText; locale: Locale }) {
  return (
    <div className="metric-hover rounded-xl bg-muted/30 p-4 ring-1 ring-border/40">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <BarChart3 aria-hidden="true" />
        {text(title, locale)}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
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
    <section className="welcome-gradient rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-xl">
      <p className="text-sm text-muted-foreground">{text(ui.appNameFull, locale)}</p>
      <h2 className="text-gradient-health mt-2 text-3xl font-bold tracking-tight">{text(title, locale)}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{text(description, locale)}</p>
    </section>
  );
}
