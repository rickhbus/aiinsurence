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
  Dumbbell,
  HeartPulse,
  Home,
  Moon,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Search,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserRound,
  Waves,
  type LucideIcon,
} from "lucide-react";
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
      { label: { zh: "今日", en: "Today" }, href: "/today", page: "today", icon: Home },
      { label: { zh: "進階資料", en: "Advanced" }, href: "/today/advanced", page: "today-advanced", icon: BarChart3 },
    ],
  },
  {
    id: "log",
    label: { zh: "記錄", en: "Log" },
    icon: ClipboardList,
    children: [
      { label: { zh: "記錄總覽", en: "Log overview" }, href: "/track", page: "track", icon: ClipboardList },
      { label: { zh: "食物", en: "Food" }, href: "/food", page: "food", icon: Apple },
      { label: { zh: "飲水", en: "Water" }, href: "/hydration", page: "hydration", icon: Waves },
      { label: { zh: "廁所", en: "Toilet" }, href: "/toilet", page: "toilet", icon: Waves },
      { label: { zh: "運動", en: "Movement" }, href: "/gym", page: "gym", icon: Dumbbell },
    ],
  },
  {
    id: "ai",
    label: { zh: "AI", en: "AI" },
    icon: Brain,
    children: [
      { label: { zh: "AI", en: "AI" }, href: "/coach", page: "coach", icon: Brain },
    ],
  },
  {
    id: "more",
    label: { zh: "更多", en: "More" },
    icon: MoreHorizontal,
    children: [
      { label: { zh: "更多", en: "More" }, href: "/more", page: "more", icon: MoreHorizontal },
      { label: { zh: "Reports", en: "Reports" }, href: "/reports", page: "reports", icon: BarChart3 },
      { label: { zh: "Doctor Prep", en: "Doctor Prep" }, href: "/doctor", page: "doctor", icon: Stethoscope },
      { label: { zh: "Insurance", en: "Insurance" }, href: "/insurance", page: "insurance", icon: ShieldCheck },
      { label: { zh: "Pricing", en: "Pricing" }, href: "/pricing", page: "pricing", icon: ShieldCheck },
      { label: { zh: "Business", en: "Business" }, href: "/business", page: "business", icon: Activity },
      { label: { zh: "GBL", en: "GBL" }, href: "/gbl", page: "gbl", icon: Brain },
      { label: { zh: "Emotion Engine", en: "Emotion Engine" }, href: "/emotion", page: "emotion", icon: HeartPulse },
      { label: { zh: "Family", en: "Family" }, href: "/family", page: "family", icon: UserRound },
      { label: ui.settings, href: "/settings", page: "settings", icon: UserRound },
    ],
  },
];

const bottomNavItems = [
  { label: { zh: "今日 / Today", en: "Today" }, href: "/today", icon: Home, page: "today" as HealthPage },
  { label: { zh: "記錄 / Log", en: "Log" }, href: "/track", icon: ClipboardList, page: "track" as HealthPage },
  { label: { zh: "AI", en: "AI" }, href: "/coach", icon: Brain, page: "coach" as HealthPage },
  { label: { zh: "更多 / More", en: "More" }, href: "/more", icon: MoreHorizontal, page: "more" as HealthPage },
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
    const preferred = activeGroup?.id === "today" ? ["today", "log"] : ["today", activeGroup?.id ?? "log"];
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
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border/60 bg-sidebar/85 backdrop-blur-2xl transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[76px]" : "w-[280px]",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <div className="mb-4 flex items-center gap-2 px-1">
          <Link href="/today" className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-md shadow-primary/25">
              <HeartPulse aria-hidden="true" />
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <strong className="block truncate text-base">{text(ui.appName, locale)}</strong>
                <span className="block truncate text-xs text-muted-foreground">AI Health Guide</span>
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
                className="h-9 rounded-2xl bg-background/70 pl-9"
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

        <div className={cn("mt-4 rounded-2xl border border-primary/15 bg-primary/5 shadow-sm", collapsed ? "grid place-items-center p-2" : "p-3")}>
          {!collapsed ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="w-fit">
                  {locale === "zh-Hant" ? "私隱優先" : "Privacy first"}
                </Badge>
                <ShieldCheck aria-hidden="true" className="text-primary" />
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
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border/50 bg-background/75 px-4 backdrop-blur-2xl lg:px-6">
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
          <p className="truncate text-xs text-muted-foreground">{text(ui.appNameFull, locale)}</p>
          <h1 className="truncate text-lg font-semibold tracking-normal sm:text-xl">{text(activeLabel, locale)}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="hidden md:inline-flex">
          {locale === "zh-Hant" ? "記憶: 開啟" : "Memory: on"}
        </Badge>
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
                size="icon"
                className="hidden xl:inline-flex"
                aria-label={coachOpen ? (locale === "zh-Hant" ? "隱藏 AI 教練" : "Hide AI coach") : (locale === "zh-Hant" ? "顯示 AI 教練" : "Show AI coach")}
                onClick={onCoachToggle}
              >
                {coachOpen ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
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
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid min-h-20 grid-cols-4 border-t border-border/40 bg-background/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden" aria-label="Mobile bottom navigation">
      {bottomNavItems.map((item) => {
        const active = isPageInGroup(currentPage, item.page) || currentPage === item.page;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[0.68rem] font-medium text-muted-foreground transition-all duration-200",
              active && "bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-md shadow-primary/25",
            )}
          >
            <item.icon aria-hidden="true" />
            <span className="truncate">{text(item.label, locale)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function WelcomeStrip({ locale, data }: { locale: Locale; data?: DashboardData | null }) {
  const guestName = locale === "zh-Hant" ? "匿名使用者" : "anonymous user";
  const emptyValue = locale === "zh-Hant" ? "未設定" : "Not set";

  return (
    <section className="welcome-gradient overflow-hidden rounded-3xl border border-border/50 bg-card/72 p-5 shadow-lg shadow-primary/5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {locale === "zh-Hant"
              ? `早晨，${data?.profile.displayName || guestName}`
              : `Good morning, ${data?.profile.displayName || guestName}`}
          </p>
          <h2 className="text-gradient-health mt-2 text-[clamp(2rem,9vw,3.25rem)] font-bold leading-tight tracking-tight">
            {locale === "zh-Hant" ? "小習慣，強健康。" : "Small habits, strong health."}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {locale === "zh-Hant"
              ? "今天用一個小行動，改善你的活動、飲食、睡眠和健康知識。"
              : "Use one small action today to improve your activity, food, sleep, and health knowledge."}
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2 overflow-hidden">
          <Badge variant="secondary">{data?.profile.goal || emptyValue}</Badge>
          <Badge variant="secondary">{data?.profile.location || emptyValue}</Badge>
          <Badge variant="secondary">{data?.profile.fitnessLevel || emptyValue}</Badge>
          <Badge variant="secondary">
            {data?.profile.preferredLanguage === "en"
              ? "Prefers English"
              : locale === "zh-Hant" ? "偏好繁體中文" : "Prefers Traditional Chinese"}
          </Badge>
          <Badge variant="secondary">
            {data?.profile.memoryEnabled
              ? locale === "zh-Hant" ? "健康記憶已開啟" : "Memory on"
              : locale === "zh-Hant" ? "健康記憶未儲存" : "No saved memory"}
          </Badge>
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
          "flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:text-foreground",
          active && "bg-primary/8 text-foreground",
        )}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl bg-muted/60 text-muted-foreground transition-all duration-200", active && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20")}>
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
                  "flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-foreground",
                  childActive && "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-sm shadow-primary/15 hover:from-primary hover:to-primary/85 hover:text-primary-foreground",
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

function isPageInGroup(currentPage: HealthPage, groupPage: HealthPage) {
  const group = navGroups.find((item) => groupIncludesPage(item, groupPage));
  return Boolean(group?.children.some((child) => child.page === currentPage));
}

function groupIncludesPage(group: NavGroup, page: HealthPage) {
  if (group.children.some((child) => child.page === page)) {
    return true;
  }

  return (
    (group.id === "today" && (page === "today" || page === "today-advanced")) ||
    (group.id === "log" && ["track", "check-in", "mood", "food", "hydration", "toilet", "gym"].includes(page)) ||
    (group.id === "ai" && page === "coach") ||
    (group.id === "more" && [
      "more",
      "reports",
      "doctor",
      "insurance",
      "pricing",
      "business",
      "gbl",
      "emotion",
      "family",
      "settings",
    ].includes(page))
  );
}
