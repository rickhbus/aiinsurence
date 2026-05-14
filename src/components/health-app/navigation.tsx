"use client";

import {
  Activity,
  Apple,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  BookOpenCheck,
  Dumbbell,
  Flame,
  Gem,
  HeartPulse,
  Home,
  Moon,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Trophy,
  UserRound,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { label, locales, text, ui } from "@/lib/health-app/i18n";
import type { HealthPage, Locale, LocalizedText } from "@/lib/health-app/types";
import type { DashboardData } from "@/lib/health-data/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GameBottomNav } from "@/components/health-quest/game-bottom-nav";
import { safeGameStats, turtleCoachIdentity } from "@/lib/health-quest/play-system";

type NavChild = {
  label: LocalizedText;
  href: string;
  page: HealthPage;
  icon?: LucideIcon;
  badge?: LocalizedText;
};

type NavGroup = {
  id: string;
  label: LocalizedText;
  icon: LucideIcon;
  children: NavChild[];
  badge?: LocalizedText;
};

export const navGroups: NavGroup[] = [
  {
    id: "today",
    label: { zh: "今日", en: "Today" },
    icon: Home,
    children: [
      { label: { zh: "健康任務", en: "Health Quest" }, href: "/today", page: "today", icon: Home },
      { label: { zh: "進階資料", en: "Advanced" }, href: "/today/advanced", page: "today-advanced", icon: BarChart3 },
      { label: { zh: "練習", en: "Practice" }, href: "/practice", page: "practice", icon: BookOpenCheck },
    ],
  },
  {
    id: "coach",
    label: turtleCoachIdentity.mascot,
    icon: Brain,
    children: [
      { label: ui.coach, href: "/coach", page: "coach", icon: Brain },
      { label: { zh: "醫療導航", en: "Care Navigation" }, href: "/healthcare", page: "healthcare", icon: Stethoscope },
    ],
  },
  {
    id: "progress",
    label: { zh: "進度", en: "Progress" },
    icon: BarChart3,
    children: [
      { label: { zh: "任務進度", en: "Quest Progress" }, href: "/progress", page: "progress", icon: BarChart3 },
      { label: { zh: "健康聯賽", en: "Health Leagues" }, href: "/leagues", page: "leagues", icon: Trophy },
      { label: { zh: "每週建議", en: "Reports" }, href: "/reports", page: "reports", icon: BarChart3 },
    ],
  },
  {
    id: "learn",
    label: { zh: "學習", en: "Learn" },
    icon: BookOpenCheck,
    children: [
      { label: { zh: "健康小課", en: "Tiny Lessons" }, href: "/learn", page: "learn", icon: BookOpenCheck },
      { label: { zh: "保險教育", en: "Insurance Education" }, href: "/insurance", page: "insurance", icon: ShieldCheck },
    ],
  },
  {
    id: "more",
    label: { zh: "更多", en: "More" },
    icon: MoreHorizontal,
    children: [
      { label: { zh: "更多", en: "More" }, href: "/more", page: "more", icon: MoreHorizontal },
      { label: { zh: "快速打卡", en: "Check-in" }, href: "/check-in", page: "check-in", icon: ClipboardList },
      { label: { zh: "心情", en: "Mood" }, href: "/mood", page: "mood", icon: HeartPulse },
      { label: { zh: "食物", en: "Food" }, href: "/food", page: "food", icon: Apple },
      { label: { zh: "飲水", en: "Hydration" }, href: "/hydration", page: "hydration", icon: Waves },
      { label: { zh: "廁所", en: "Toilet" }, href: "/toilet", page: "toilet", icon: Waves },
      { label: { zh: "健身", en: "Gym" }, href: "/gym", page: "gym", icon: Dumbbell },
      { label: { zh: "健身模板", en: "Gym Templates" }, href: "/gym/templates", page: "gym-templates", icon: Dumbbell },
      { label: { zh: "屋企人", en: "Family" }, href: "/family", page: "family", icon: Users },
      { label: { zh: "醫生準備", en: "Doctor Prep" }, href: "/doctor", page: "doctor", icon: Stethoscope },
      { label: { zh: "收費", en: "Pricing" }, href: "/pricing", page: "pricing", icon: ShieldCheck },
      { label: { zh: "Business", en: "Business" }, href: "/business", page: "business", icon: Activity },
      { label: { zh: "GBL", en: "GBL" }, href: "/gbl", page: "gbl", icon: Brain },
      { label: { zh: "Emotion Engine", en: "Emotion Engine" }, href: "/emotion", page: "emotion", icon: HeartPulse },
      { label: { zh: "分析歷史", en: "History" }, href: "/history", page: "history", icon: ClipboardList },
      { label: ui.profile, href: "/profile", page: "profile", icon: UserRound },
      { label: ui.settings, href: "/settings", page: "settings", icon: UserRound },
    ],
  },
];

export function Sidebar({
  currentPage,
  locale,
  collapsed = false,
  onCollapsedChange,
}: {
  currentPage: HealthPage;
  locale: Locale;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const activeGroup = useMemo(() => findActiveGroup(currentPage), [currentPage]);
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const preferred = activeGroup?.id === "today" ? ["today", "coach"] : ["today", activeGroup?.id ?? "coach"];
    return Array.from(new Set(preferred)).slice(0, 2);
  });
  const filteredGroups = filterGroups(navGroups, query, locale);

  function toggleGroup(groupId: string) {
    setOpenGroups((current) => {
      if (current.includes(groupId)) {
        return current.filter((item) => item !== groupId);
      }

      return [...current, groupId].slice(-2);
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-white/60 bg-sidebar/88 shadow-[8px_0_30px_rgba(15,118,110,0.08)] backdrop-blur-2xl transition-[width] duration-300 ease-out dark:border-white/10 lg:flex",
        collapsed ? "w-[76px]" : "w-[280px]",
      )}
    >
      <div className="play-shell-bg flex min-h-0 flex-1 flex-col px-3 py-4">
        <div className="mb-4 flex items-center gap-2 px-1">
          <Link href="/today" className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-lime-300 via-teal-400 to-sky-300 shadow-md shadow-teal-700/20 dark:border-white/10">
              <Image src="/turtle-avatar-transparent.png" alt="" aria-hidden="true" width={80} height={80} className="size-11 object-contain drop-shadow-sm" priority />
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <strong className="block truncate text-base">{locale === "zh-Hant" ? "小健龜智健任務" : "Turtle Health Quest"}</strong>
                <span className="block truncate text-xs text-muted-foreground">{text(turtleCoachIdentity.mascot, locale)}</span>
              </span>
            ) : null}
          </Link>
          {!collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={locale === "zh-Hant" ? "收合側欄" : "Collapse sidebar"}
                  onClick={() => onCollapsedChange?.(true)}
                >
                  <ChevronsLeft aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{locale === "zh-Hant" ? "收合側欄" : "Collapse sidebar"}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                className="mx-auto mb-4"
                aria-label={locale === "zh-Hant" ? "展開側欄" : "Expand sidebar"}
                onClick={() => onCollapsedChange?.(false)}
              >
                <ChevronsRight aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{locale === "zh-Hant" ? "展開側欄" : "Expand sidebar"}</TooltipContent>
          </Tooltip>
        ) : (
          <div className="mb-4 flex flex-col gap-3">
            <label className="relative block">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={locale === "zh-Hant" ? "搜尋功能..." : "Search navigation..."}
                  className="h-10 rounded-2xl border-white/60 bg-background/76 pl-9 font-semibold shadow-inner dark:border-white/10"
                  aria-label={locale === "zh-Hant" ? "搜尋側欄" : "Search sidebar"}
                />
            </label>
          </div>
        )}

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Main navigation">
          <div className={cn("flex flex-col", collapsed ? "gap-2" : "gap-2")}>
            {filteredGroups.map((group) => (
              <SidebarGroup
                key={group.id}
                group={group}
                currentPage={currentPage}
                locale={locale}
                collapsed={collapsed}
                open={query.trim().length > 0 || openGroups.includes(group.id)}
                onToggle={() => toggleGroup(group.id)}
              />
            ))}
          </div>
        </nav>

          <div className={cn("mt-4 rounded-[1.35rem] border border-primary/15 bg-primary/5 shadow-sm", collapsed ? "grid place-items-center p-2" : "p-3")}>
            {!collapsed ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="w-fit rounded-full">
                    {locale === "zh-Hant" ? "私隱優先" : "Privacy first"}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    <Gem aria-hidden="true" className="size-3.5" />
                    {safeGameStats.gems}
                  </Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {locale === "zh-Hant"
                  ? "健康記憶只會在你同意後保存，並可隨時刪除。"
                  : "Health memory is saved only with consent and can be deleted anytime."}
              </p>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <ShieldCheck aria-label="Privacy first" className="text-primary" />
              </TooltipTrigger>
              <TooltipContent side="right">
                {locale === "zh-Hant" ? "私隱優先" : "Privacy first"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </aside>
  );
}

export function TopHeader({
  currentPage,
  locale,
  setLocale,
  sidebarCollapsed,
  onSidebarToggle,
  coachOpen,
  onCoachToggle,
  showCoachToggle,
}: {
  currentPage: HealthPage;
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  coachOpen: boolean;
  onCoachToggle: () => void;
  showCoachToggle: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const activeLabel = findActiveLabel(currentPage);

    return (
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-white/60 bg-background/78 px-4 shadow-[0_10px_30px_rgba(15,118,110,0.08)] backdrop-blur-2xl dark:border-white/10 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          aria-label={sidebarCollapsed ? (locale === "zh-Hant" ? "展開側欄" : "Expand sidebar") : (locale === "zh-Hant" ? "收合側欄" : "Collapse sidebar")}
          onClick={onSidebarToggle}
        >
          {sidebarCollapsed ? <ChevronsRight aria-hidden="true" /> : <ChevronsLeft aria-hidden="true" />}
        </Button>

          <div className="min-w-0">
            <p className="truncate text-xs font-black text-teal-700 dark:text-teal-200">{text(turtleCoachIdentity.mascot, locale)}</p>
            <h1 className="truncate text-lg font-black tracking-normal sm:text-xl">{text(activeLabel, locale)}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 md:flex">
            <HeaderStatPill icon={Flame} label={locale === "zh-Hant" ? "連續" : "Streak"} value={`${safeGameStats.streak}`} />
            <HeaderStatPill icon={Sparkles} label="XP" value={`${safeGameStats.xp}`} />
            <HeaderStatPill icon={Gem} label={locale === "zh-Hant" ? "寶石" : "Gems"} value={`${safeGameStats.gems}`} />
          </div>
        <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
          <SelectTrigger className="hidden w-36 sm:flex" aria-label={label(ui.language, locale)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {locales.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={label(ui.darkMode, locale)}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label(ui.darkMode, locale)}</TooltipContent>
        </Tooltip>
          {showCoachToggle ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden min-h-10 rounded-2xl border-teal-500/25 bg-teal-500/10 px-3 font-black text-teal-700 hover:bg-teal-500/15 dark:text-teal-200 xl:inline-flex"
                  aria-label={coachOpen ? (locale === "zh-Hant" ? "隱藏 AI 教練" : "Hide AI coach") : (locale === "zh-Hant" ? "顯示 AI 教練" : "Show AI coach")}
                  onClick={onCoachToggle}
                >
                  <span className="grid size-6 overflow-hidden rounded-full bg-white/75">
                    <Image src="/turtle-avatar-transparent.png" alt="" aria-hidden="true" width={40} height={40} className="size-6 object-contain" />
                  </span>
                  {coachOpen ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
                  <span>{locale === "zh-Hant" ? "小健龜" : "Coach"}</span>
                </Button>
              </TooltipTrigger>
            <TooltipContent>
              {coachOpen ? (locale === "zh-Hant" ? "隱藏 AI 教練" : "Hide AI coach") : (locale === "zh-Hant" ? "顯示 AI 教練" : "Show AI coach")}
            </TooltipContent>
          </Tooltip>
        ) : null}
        <Button asChild variant="outline" size="icon" aria-label={text(ui.profile, locale)}>
          <Link href="/profile">
            <UserRound aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

export function MobileBottomNav({ currentPage, locale }: { currentPage: HealthPage; locale: Locale }) {
  return <GameBottomNav currentPage={currentPage} locale={locale} />;
}

function HeaderStatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
}) {
  return (
    <span className="play-stat-pill">
      <Icon aria-hidden="true" className="size-3.5 text-teal-600 dark:text-teal-200" />
      <span className="hidden xl:inline">{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

export function WelcomeStrip({ locale, data }: { locale: Locale; data?: DashboardData | null }) {
  const guestName = locale === "zh-Hant" ? "匿名使用者" : "anonymous user";
  const emptyValue = locale === "zh-Hant" ? "未設定" : "Not set";
  const score = data?.today.health_score ?? 0;
  const level = Math.max(1, Math.ceil(score / 20));

  return (
    <section className="play-island-card welcome-gradient overflow-hidden rounded-[1.8rem] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-teal-700 dark:text-teal-200">
            {locale === "zh-Hant"
              ? `早晨，${data?.profile.displayName || guestName}`
              : `Good morning, ${data?.profile.displayName || guestName}`}
          </p>
          <h2 className="text-gradient-health mt-2 text-[clamp(2rem,9vw,3.25rem)] font-bold leading-tight tracking-tight">
            {locale === "zh-Hant" ? "今日任務中心" : "Today’s quest hub"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {locale === "zh-Hant"
              ? "小健龜會用真實紀錄整理任務、學習和安全下一步。分數只作生活方式教育參考。"
              : "The Turtle Coach turns real records into quests, lessons, and a safer next step. Scores are lifestyle education only."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="play-stat-pill"><Trophy aria-hidden="true" className="size-4 text-amber-600" /> Level {level}</span>
            <span className="play-stat-pill"><Sparkles aria-hidden="true" className="size-4 text-sky-600" /> {score} XP</span>
            <span className="play-stat-pill"><Flame aria-hidden="true" className="size-4 text-orange-600" /> {data?.weekly.workout_days ?? 0}d</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3 rounded-[1.5rem] border border-white/60 bg-white/58 p-4 shadow-inner dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[1.2rem] bg-gradient-to-br from-lime-300 via-teal-400 to-sky-300">
              <Image src="/turtle-avatar-transparent.png" alt="" aria-hidden="true" width={96} height={96} className="size-16 object-contain" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{text(turtleCoachIdentity.mascot, locale)}</p>
              <p className="text-xs leading-5 text-muted-foreground">{locale === "zh-Hant" ? "下一步：完成一個小任務" : "Next: finish one tiny quest"}</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2 overflow-hidden">
            <Badge variant="secondary" className="rounded-full">{data?.profile.goal || emptyValue}</Badge>
            <Badge variant="secondary" className="rounded-full">{data?.profile.location || emptyValue}</Badge>
            <Badge variant="secondary" className="rounded-full">{data?.profile.fitnessLevel || emptyValue}</Badge>
            <Badge variant="secondary" className="rounded-full">
              {data?.profile.memoryEnabled
                ? locale === "zh-Hant" ? "記憶需同意" : "Consent memory"
                : locale === "zh-Hant" ? "未保存記憶" : "No saved memory"}
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}

function SidebarGroup({
  group,
  currentPage,
  locale,
  collapsed,
  open,
  onToggle,
}: {
  group: NavGroup;
  currentPage: HealthPage;
  locale: Locale;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const active = groupIncludesPage(group, currentPage);
  const primaryHref = group.children[0]?.href ?? "/dashboard";

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={primaryHref}
            className={cn(
              "mx-auto grid size-11 place-items-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
            aria-label={text(group.label, locale)}
          >
            <group.icon aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{text(group.label, locale)}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <section className="rounded-2xl">
        <button
          type="button"
          className={cn(
            "flex min-h-12 w-full items-center gap-3 rounded-[1.15rem] px-3 text-left text-sm font-black text-muted-foreground transition-all duration-200 hover:bg-white/65 hover:text-foreground hover:shadow-sm dark:hover:bg-white/8",
            active && "bg-white/75 text-foreground shadow-sm ring-1 ring-teal-500/15 dark:bg-white/10",
          )}
        aria-expanded={open}
        onClick={onToggle}
      >
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-2xl bg-muted/60 text-muted-foreground transition-all duration-200", active && "bg-gradient-to-br from-lime-400 via-teal-500 to-sky-500 text-white shadow-sm shadow-primary/20")}>
          <group.icon aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 truncate">{text(group.label, locale)}</span>
        {group.badge ? <Badge variant="secondary">{text(group.badge, locale)}</Badge> : null}
        <ChevronDown aria-hidden="true" className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
          <div className="mt-1 grid gap-1 pl-11">
          {group.children.map((child) => {
            const childActive = currentPage === child.page && !child.href.includes("#");

            return (
              <Link
                key={child.href + child.label.en}
                href={child.href}
                  className={cn(
                    "flex min-h-10 items-center gap-2 rounded-2xl px-3 text-xs font-black text-muted-foreground transition-all duration-200 hover:bg-white/65 hover:text-foreground dark:hover:bg-white/8",
                    childActive && "play-pressable bg-gradient-to-r from-lime-400 via-teal-500 to-teal-700 text-white hover:text-white",
                  )}
              >
                <span className="min-w-0 flex-1 truncate">{text(child.label, locale)}</span>
                {child.badge ? (
                  <Badge variant={childActive ? "secondary" : "outline"}>{text(child.badge, locale)}</Badge>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function filterGroups(groups: NavGroup[], query: string, locale: Locale) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return groups;
  }

  return groups
    .map((group) => {
      const groupMatches = text(group.label, locale).toLowerCase().includes(normalized) || group.label.en.toLowerCase().includes(normalized);
      const children = group.children.filter((child) => {
        return (
          text(child.label, locale).toLowerCase().includes(normalized) ||
          child.label.en.toLowerCase().includes(normalized)
        );
      });

      return groupMatches ? group : { ...group, children };
    })
    .filter((group) => group.children.length > 0);
}

function findActiveGroup(currentPage: HealthPage) {
  return navGroups.find((group) => groupIncludesPage(group, currentPage));
}

function findActiveLabel(currentPage: HealthPage) {
  for (const group of navGroups) {
    const child = group.children.find((item) => item.page === currentPage);
    if (child) {
      return child.label;
    }
  }

  const group = findActiveGroup(currentPage);
  if (group) {
    return group.label;
  }

  return ui.dashboard;
}

function groupIncludesPage(group: NavGroup, page: HealthPage) {
  if (group.children.some((child) => child.page === page)) {
    return true;
  }

  return (
    (group.id === "today" && (page === "today" || page === "today-advanced" || page === "practice")) ||
    (group.id === "coach" && ["coach", "healthcare", "symptom-routing"].includes(page)) ||
    (group.id === "progress" && ["progress", "reports", "goals", "leagues"].includes(page)) ||
    (group.id === "learn" && ["learn", "lesson", "insurance"].includes(page)) ||
    (group.id === "more" && [
      "more",
      "check-in",
      "mood",
      "food",
      "hydration",
      "toilet",
      "gym",
      "gym-templates",
      "track",
      "running",
      "walking",
      "sports",
      "body",
      "sleep",
      "water",
      "nutrition",
      "food-log",
      "diet-plan",
      "family",
      "doctor",
      "pricing",
      "business",
      "gbl",
      "emotion",
      "history",
      "profile",
      "memory",
      "settings",
    ].includes(page))
  );
}
