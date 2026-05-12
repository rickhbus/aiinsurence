"use client";

import {
  Activity,
  Apple,
  BarChart3,
  BedDouble,
  BookOpenCheck,
  Brain,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Dumbbell,
  Footprints,
  HeartPulse,
  Home,
  Menu,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Scale,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
    id: "home",
    label: { zh: "主頁", en: "Home" },
    icon: Home,
    children: [
      { label: ui.dashboard, href: "/dashboard", page: "dashboard", icon: Home },
      { label: { zh: "今日狀態", en: "Today" }, href: "/today", page: "today", icon: Activity, badge: { zh: "新", en: "New" } },
      { label: { zh: "快速 Check-in", en: "Check-in" }, href: "/check-in", page: "check-in", icon: Sun },
      { label: ui.coach, href: "/coach", page: "coach", icon: Brain },
    ],
  },
  {
    id: "track",
    label: ui.track,
    icon: Footprints,
    badge: { zh: "2", en: "2" },
    children: [
      { label: ui.running, href: "/track/running", page: "running", icon: Footprints },
      { label: ui.walking, href: "/track/walking", page: "walking", icon: Footprints },
      { label: ui.gym, href: "/gym", page: "gym", icon: Dumbbell },
      { label: { zh: "健身模板", en: "Gym templates" }, href: "/gym/templates", page: "gym-templates", icon: Dumbbell },
      { label: ui.sports, href: "/track/sports", page: "sports", icon: Activity },
      { label: ui.body, href: "/track/body", page: "body", icon: Scale },
      { label: ui.sleep, href: "/track/sleep", page: "sleep", icon: BedDouble },
      { label: { zh: "補水", en: "Hydration" }, href: "/hydration", page: "hydration", icon: Waves },
      { label: { zh: "腸胃 / 小便", en: "Toilet" }, href: "/toilet", page: "toilet", icon: Waves },
    ],
  },
  {
    id: "nutrition",
    label: ui.nutrition,
    icon: Apple,
    children: [
      { label: ui.foodLog, href: "/food", page: "food", icon: Apple, badge: { zh: "未記錄", en: "Due" } },
      { label: ui.dietPlan, href: "/nutrition/diet-plan", page: "diet-plan", icon: Apple },
      { label: ui.mealRecommendations, href: "/nutrition", page: "nutrition", icon: Apple },
      { label: ui.caloriesMacros, href: "/nutrition", page: "nutrition", icon: BarChart3 },
      { label: ui.groceryIdeas, href: "/nutrition", page: "nutrition", icon: Apple },
    ],
  },
  {
    id: "learn",
    label: ui.learn,
    icon: BookOpenCheck,
    children: [
      { label: ui.fitnessBasics, href: "/learn", page: "learn", icon: Dumbbell },
      { label: ui.nutritionGuide, href: "/learn", page: "learn", icon: Apple },
      { label: ui.exerciseLibrary, href: "/learn", page: "learn", icon: BookOpenCheck },
      { label: ui.conditionsEducation, href: "/learn", page: "learn", icon: HeartPulse },
      { label: ui.hkCareGuide, href: "/learn", page: "learn", icon: Stethoscope },
    ],
  },
  {
    id: "intelligence",
    label: ui.intelligence,
    icon: Brain,
    badge: { zh: "GBL", en: "GBL" },
    children: [
      { label: ui.gbl, href: "/gbl", page: "gbl", icon: Brain },
      { label: ui.emotionEngine, href: "/emotion", page: "emotion", icon: HeartPulse },
      { label: { zh: "心情教練", en: "Mood coach" }, href: "/mood", page: "mood", icon: HeartPulse },
      { label: ui.history, href: "/history", page: "history", icon: BarChart3 },
    ],
  },
  {
    id: "healthcare",
    label: ui.healthcare,
    icon: Stethoscope,
    children: [
      { label: ui.symptomRouting, href: "/healthcare/symptom-routing", page: "symptom-routing", icon: Stethoscope },
      { label: ui.urgentSigns, href: "/healthcare", page: "healthcare", icon: ShieldCheck },
      { label: ui.publicPrivate, href: "/healthcare", page: "healthcare", icon: Stethoscope },
      { label: ui.specialistFinder, href: "/healthcare", page: "healthcare", icon: Stethoscope },
      { label: ui.visitPreparation, href: "/doctor", page: "doctor", icon: BookOpenCheck },
    ],
  },
  {
    id: "insurance",
    label: ui.insurance,
    icon: ShieldCheck,
    children: [
      { label: ui.policyExplainer, href: "/insurance", page: "insurance", icon: ShieldCheck },
      { label: ui.coverageTypes, href: "/insurance", page: "insurance", icon: ShieldCheck },
      { label: ui.claimPreparation, href: "/insurance", page: "insurance", icon: BookOpenCheck },
      { label: ui.exclusions, href: "/insurance", page: "insurance", icon: ShieldCheck },
      { label: ui.questionsToAsk, href: "/insurance", page: "insurance", icon: Brain },
      { label: { zh: "收費方案", en: "Pricing" }, href: "/pricing", page: "pricing", icon: ShieldCheck },
      { label: { zh: "商業合作", en: "Business" }, href: "/business", page: "business", icon: BookOpenCheck },
    ],
  },
  {
    id: "progress",
    label: ui.progress,
    icon: BarChart3,
    children: [
      { label: ui.weeklyReport, href: "/reports", page: "reports", icon: BarChart3 },
      { label: ui.goals, href: "/goals", page: "goals", icon: Activity },
      { label: ui.streaks, href: "/progress", page: "progress", icon: Activity },
      { label: ui.achievements, href: "/progress", page: "progress", icon: ShieldCheck },
      { label: ui.trends, href: "/progress", page: "progress", icon: BarChart3 },
    ],
  },
  {
    id: "profile",
    label: ui.profile,
    icon: UserRound,
    children: [
      { label: ui.memory, href: "/profile/memory", page: "memory", icon: Brain },
      { label: { zh: "家庭照護", en: "Family" }, href: "/family", page: "family", icon: UserRound },
      { label: ui.preferences, href: "/profile", page: "profile", icon: UserRound },
      { label: ui.medicalNotes, href: "/profile", page: "profile", icon: Stethoscope },
      { label: ui.privacyConsent, href: "/settings", page: "settings", icon: ShieldCheck },
      { label: ui.settings, href: "/settings", page: "settings", icon: UserRound },
    ],
  },
];

const quickAddActions: NavChild[] = [
  { label: { zh: "新增跑步", en: "Add run" }, href: "/track/running", page: "running", icon: Footprints },
  { label: { zh: "新增健身", en: "Add gym" }, href: "/gym", page: "gym", icon: Dumbbell },
  { label: { zh: "新增飲食", en: "Add food" }, href: "/food", page: "food", icon: Apple },
  { label: { zh: "新增飲水", en: "Add water" }, href: "/hydration", page: "hydration", icon: Waves },
  { label: { zh: "新增睡眠", en: "Add sleep" }, href: "/track/sleep", page: "sleep", icon: BedDouble },
  { label: { zh: "新增體重", en: "Add weight" }, href: "/track/body", page: "body", icon: Scale },
  { label: { zh: "新增症狀", en: "Add symptom" }, href: "/healthcare/symptom-routing", page: "symptom-routing", icon: Stethoscope },
  { label: { zh: "新增保險備註", en: "Add insurance note" }, href: "/insurance", page: "insurance", icon: ShieldCheck },
];

const bottomNavItems = [
  { label: { zh: "今日", en: "Today" }, href: "/today", icon: Home, page: "today" as HealthPage },
  { label: ui.track, href: "/track", icon: Footprints, page: "track" as HealthPage },
  { label: ui.nutrition, href: "/food", icon: Apple, page: "food" as HealthPage },
  { label: ui.healthcare, href: "/healthcare", icon: Stethoscope, page: "healthcare" as HealthPage },
  { label: ui.coach, href: "/coach", icon: Brain, page: "coach" as HealthPage },
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
    const preferred = activeGroup?.id === "home" ? ["home", "track"] : ["home", activeGroup?.id ?? "track"];
    return Array.from(new Set(preferred)).slice(0, 2);
  });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
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
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-3">
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
            <QuickAddMenu locale={locale} open={quickAddOpen} onOpenChange={setQuickAddOpen} />
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
  const [open, setOpen] = useState(false);
  const activeLabel = findActiveLabel(currentPage);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border/50 bg-background/75 px-4 backdrop-blur-2xl lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-sm p-0">
            <SheetHeader className="border-b p-4 text-left">
              <SheetTitle>{text(ui.appNameFull, locale)}</SheetTitle>
              <SheetDescription>
                {locale === "zh-Hant"
                  ? "健身、營養、醫療導航和保險教育。"
                  : "Fitness, nutrition, care navigation, and insurance education."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
              <QuickAddMenu locale={locale} open onOpenChange={() => undefined} staticOpen />
              {navGroups.map((group) => (
                <MobileMenuGroup
                  key={group.id}
                  group={group}
                  currentPage={currentPage}
                  locale={locale}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          </SheetContent>
        </Sheet>

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
    <nav className="fixed inset-x-0 bottom-0 z-40 grid min-h-20 grid-cols-5 border-t border-border/40 bg-background/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden" aria-label="Mobile bottom navigation">
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

export function QuickAddButton({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-[calc(5.75rem_+_env(safe-area-inset-bottom))] z-40 lg:hidden">
      {open ? (
        <div className="mb-3 grid w-56 gap-2 rounded-2xl border bg-popover p-2 text-popover-foreground shadow-lg">
          {quickAddActions.map((action) => (
            <Button key={action.href + action.label.en} asChild variant="ghost" className="justify-start">
              <Link href={action.href} onClick={() => setOpen(false)}>
                {action.icon ? <action.icon data-icon="inline-start" aria-hidden="true" /> : null}
                {text(action.label, locale)}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-lg"
            className="fab-glow rounded-full bg-gradient-to-br from-primary to-primary/80"
            aria-label={label(ui.quickAdd, locale)}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <Plus aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label(ui.quickAdd, locale)}</TooltipContent>
      </Tooltip>
    </div>
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

function MobileMenuGroup({
  group,
  currentPage,
  locale,
  onNavigate,
}: {
  group: NavGroup;
  currentPage: HealthPage;
  locale: Locale;
  onNavigate: () => void;
}) {
  const active = groupIncludesPage(group, currentPage);

  return (
    <section className="rounded-2xl border bg-card/70 p-2">
      <div className="mb-1 flex items-center gap-2 px-2 py-1 text-sm font-medium">
        <group.icon aria-hidden="true" className={cn("text-muted-foreground", active && "text-primary")} />
        <span>{text(group.label, locale)}</span>
      </div>
      <div className="grid gap-1">
        {group.children.map((child) => {
          const childActive = currentPage === child.page && !child.href.includes("#");

          return (
            <Link
              key={child.href + child.label.en}
              href={child.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-10 items-center justify-between rounded-xl px-3 text-sm text-muted-foreground",
                childActive && "bg-primary text-primary-foreground",
              )}
            >
              <span>{text(child.label, locale)}</span>
              {child.badge ? <Badge variant="secondary">{text(child.badge, locale)}</Badge> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function QuickAddMenu({
  locale,
  open,
  onOpenChange,
  staticOpen = false,
}: {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staticOpen?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card/78 p-2 shadow-sm">
      {!staticOpen ? (
        <Button className="w-full justify-between rounded-xl" onClick={() => onOpenChange(!open)} aria-expanded={open}>
          <span className="inline-flex items-center gap-2">
            <Plus data-icon="inline-start" aria-hidden="true" />
            {label(ui.quickAdd, locale)}
          </span>
          <ChevronDown aria-hidden="true" className={cn("transition-transform", open && "rotate-180")} />
        </Button>
      ) : (
        <div className="px-2 py-1 text-sm font-medium">{label(ui.quickAdd, locale)}</div>
      )}
      {(open || staticOpen) ? (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {quickAddActions.map((action) => (
            <Button key={action.href + action.label.en} asChild variant="ghost" size="sm" className="h-auto justify-start whitespace-normal rounded-xl px-2 py-2 text-left">
              <Link href={action.href}>
                {action.icon ? <action.icon data-icon="inline-start" aria-hidden="true" /> : null}
                {text(action.label, locale)}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
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
    (group.id === "track" && page === "track") ||
    (group.id === "nutrition" && page === "nutrition") ||
    (group.id === "learn" && page === "learn") ||
    (group.id === "healthcare" && page === "healthcare") ||
    (group.id === "progress" && page === "progress") ||
    (group.id === "profile" && page === "profile")
  );
}
