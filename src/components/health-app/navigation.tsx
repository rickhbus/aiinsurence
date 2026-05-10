"use client";

import {
  Activity,
  Apple,
  BarChart3,
  BookOpenCheck,
  Brain,
  ChevronDown,
  Footprints,
  HeartPulse,
  Home,
  Menu,
  Moon,
  Plus,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { demoUser } from "@/lib/health-app/mock-data";
import { label, locales, text, ui } from "@/lib/health-app/i18n";
import type { HealthPage, Locale, LocalizedText } from "@/lib/health-app/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type NavItem = {
  label: LocalizedText;
  href: string;
  icon: LucideIcon;
  page: HealthPage;
  children?: Array<Pick<NavItem, "label" | "href" | "page">>;
};

export const navItems: NavItem[] = [
  {
    label: ui.dashboard,
    href: "/dashboard",
    icon: Home,
    page: "dashboard",
  },
  {
    label: ui.todayPlan,
    href: "/dashboard#today-plan",
    icon: Activity,
    page: "dashboard",
  },
  {
    label: ui.coach,
    href: "/coach",
    icon: Brain,
    page: "coach",
  },
  {
    label: ui.track,
    href: "/track",
    icon: Footprints,
    page: "track",
    children: [
      { label: ui.running, href: "/track/running", page: "running" },
      { label: ui.walking, href: "/track/walking", page: "walking" },
      { label: ui.gym, href: "/track/gym", page: "gym" },
      { label: ui.sports, href: "/track/sports", page: "sports" },
      { label: ui.body, href: "/track/body", page: "body" },
      { label: ui.sleep, href: "/track/sleep", page: "sleep" },
      { label: ui.water, href: "/track/water", page: "water" },
    ],
  },
  {
    label: ui.nutrition,
    href: "/nutrition",
    icon: Apple,
    page: "nutrition",
    children: [
      { label: ui.foodLog, href: "/nutrition/food-log", page: "food-log" },
      { label: ui.dietPlan, href: "/nutrition/diet-plan", page: "diet-plan" },
      { label: ui.mealRecommendations, href: "/nutrition", page: "nutrition" },
      { label: ui.caloriesMacros, href: "/nutrition", page: "nutrition" },
      { label: ui.groceryIdeas, href: "/nutrition", page: "nutrition" },
    ],
  },
  {
    label: ui.learn,
    href: "/learn",
    icon: BookOpenCheck,
    page: "learn",
    children: [
      { label: ui.fitnessBasics, href: "/learn", page: "learn" },
      { label: ui.nutritionGuide, href: "/learn", page: "learn" },
      { label: ui.exerciseLibrary, href: "/learn", page: "learn" },
      { label: ui.conditionsEducation, href: "/learn", page: "learn" },
      { label: ui.hkCareGuide, href: "/learn", page: "learn" },
    ],
  },
  {
    label: ui.healthcare,
    href: "/healthcare",
    icon: Stethoscope,
    page: "healthcare",
    children: [
      { label: ui.symptomRouting, href: "/healthcare/symptom-routing", page: "symptom-routing" },
      { label: ui.urgentSigns, href: "/healthcare", page: "healthcare" },
      { label: ui.publicPrivate, href: "/healthcare", page: "healthcare" },
      { label: ui.specialistFinder, href: "/healthcare", page: "healthcare" },
      { label: ui.insurancePolicyHelper, href: "/insurance", page: "insurance" },
    ],
  },
  {
    label: ui.progress,
    href: "/progress",
    icon: BarChart3,
    page: "progress",
    children: [
      { label: ui.weeklyReport, href: "/progress", page: "progress" },
      { label: ui.goals, href: "/goals", page: "goals" },
      { label: ui.streaks, href: "/progress", page: "progress" },
      { label: ui.achievements, href: "/progress", page: "progress" },
      { label: ui.trends, href: "/progress", page: "progress" },
    ],
  },
  {
    label: ui.profile,
    href: "/profile",
    icon: UserRound,
    page: "profile",
    children: [
      { label: ui.memory, href: "/profile/memory", page: "memory" },
      { label: ui.preferences, href: "/profile", page: "profile" },
      { label: ui.medicalNotes, href: "/profile", page: "profile" },
      { label: ui.privacyConsent, href: "/settings", page: "settings" },
      { label: ui.settings, href: "/settings", page: "settings" },
    ],
  },
];

export function Sidebar({
  currentPage,
  locale,
  collapsed = false,
}: {
  currentPage: HealthPage;
  locale: Locale;
  collapsed?: boolean;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-background/78 px-3 py-4 backdrop-blur-xl lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <Link href="/dashboard" className="mb-5 flex items-center gap-3 px-2">
        <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
          <HeartPulse aria-hidden="true" />
        </span>
        {!collapsed ? (
          <span className="min-w-0">
            <strong className="block truncate text-base">{text(ui.appName, locale)}</strong>
            <span className="block truncate text-xs text-muted-foreground">AI Health Guide</span>
          </span>
        ) : null}
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavEntry key={item.href + item.page} item={item} currentPage={currentPage} locale={locale} collapsed={collapsed} />
        ))}
      </nav>

      <div className="mt-4 rounded-lg border bg-card/80 p-3 shadow-sm">
        {!collapsed ? (
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              {locale === "zh-Hant" ? "私隱優先" : "Privacy first"}
            </Badge>
            <p className="text-xs leading-5 text-muted-foreground">
              {locale === "zh-Hant"
                ? "健康記憶只會在你同意後保存，並可隨時刪除。"
                : "Health memory is saved only with consent and can be deleted anytime."}
            </p>
          </div>
        ) : (
          <ShieldCheck aria-label="Privacy first" />
        )}
      </div>
    </aside>
  );
}

export function TopHeader({
  currentPage,
  locale,
  setLocale,
}: {
  currentPage: HealthPage;
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const activeItem =
    navItems.find((item) => item.page === currentPage || item.children?.some((child) => child.page === currentPage)) ??
    navItems[0];

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-background/78 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
            <SheetHeader className="border-b p-4 text-left">
              <SheetTitle>{text(ui.appNameFull, locale)}</SheetTitle>
              <SheetDescription>
                {locale === "zh-Hant"
                  ? "健身、營養、醫療導航和保險教育。"
                  : "Fitness, nutrition, care navigation, and insurance education."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-1 p-3">
              {navItems.map((item) => (
                <MobileMenuEntry key={item.href + item.page} item={item} currentPage={currentPage} locale={locale} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{text(ui.appNameFull, locale)}</p>
          <h1 className="truncate text-lg font-semibold tracking-normal sm:text-xl">{text(activeItem.label, locale)}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
          <SelectTrigger className="hidden w-32 sm:flex" aria-label={label(ui.language, locale)}>
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
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/coach">
            <Brain data-icon="inline-start" aria-hidden="true" />
            {text(ui.coach, locale)}
          </Link>
        </Button>
      </div>
    </header>
  );
}

export function MobileBottomNav({ currentPage, locale }: { currentPage: HealthPage; locale: Locale }) {
  const items = [
    { label: ui.dashboard, href: "/dashboard", icon: Home, page: "dashboard" as HealthPage },
    { label: ui.track, href: "/track", icon: Footprints, page: "track" as HealthPage },
    { label: ui.nutrition, href: "/nutrition", icon: Apple, page: "nutrition" as HealthPage },
    { label: ui.healthcare, href: "/healthcare", icon: Stethoscope, page: "healthcare" as HealthPage },
    { label: ui.coach, href: "/coach", icon: Brain, page: "coach" as HealthPage },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden" aria-label="Mobile bottom navigation">
      {items.map((item) => {
        const active = currentPage === item.page || navItems.find((nav) => nav.page === item.page)?.children?.some((child) => child.page === currentPage);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[0.68rem] font-medium text-muted-foreground",
              active && "bg-primary text-primary-foreground",
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
  return (
    <div className="fixed bottom-20 right-4 z-40 lg:hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-lg" className="rounded-full shadow-lg" aria-label={label(ui.quickAdd, locale)}>
            <Plus aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label(ui.quickAdd, locale)}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function WelcomeStrip({ locale }: { locale: Locale }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card/70 p-4 shadow-sm backdrop-blur-md md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          {locale === "zh-Hant" ? "早晨" : "Good morning"}, {demoUser.displayName}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal md:text-3xl">
          {locale === "zh-Hant" ? "小習慣，強健康。" : "Small habits, strong health."}
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{text(demoUser.goal, locale)}</Badge>
        <Badge variant="secondary">{text(demoUser.location, locale)}</Badge>
        <Badge variant="secondary">{text(demoUser.fitnessLevel, locale)}</Badge>
      </div>
    </section>
  );
}

function NavEntry({
  item,
  currentPage,
  locale,
  collapsed,
}: {
  item: NavItem;
  currentPage: HealthPage;
  locale: Locale;
  collapsed: boolean;
}) {
  const active = currentPage === item.page || item.children?.some((child) => child.page === currentPage);

  return (
    <div className="flex flex-col gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon aria-hidden="true" />
            {!collapsed ? <span className="min-w-0 flex-1 truncate">{text(item.label, locale)}</span> : null}
            {!collapsed && item.children?.length ? <ChevronDown aria-hidden="true" /> : null}
          </Link>
        </TooltipTrigger>
        {collapsed ? <TooltipContent side="right">{text(item.label, locale)}</TooltipContent> : null}
      </Tooltip>

      {!collapsed && item.children?.length ? (
        <div className="ml-6 flex flex-col gap-1 border-l pl-3">
          {item.children.map((child) => (
            <Link
              key={child.href + child.label.en}
              href={child.href}
              className={cn(
                "rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                currentPage === child.page && "bg-muted text-foreground",
              )}
            >
              {text(child.label, locale)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileMenuEntry({
  item,
  currentPage,
  locale,
  onNavigate,
}: {
  item: NavItem;
  currentPage: HealthPage;
  locale: Locale;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = currentPage === item.page || item.children?.some((child) => child.page === currentPage) || pathname === item.href;

  return (
    <div className="flex flex-col gap-1">
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground",
          active && "bg-primary text-primary-foreground",
        )}
      >
        <item.icon aria-hidden="true" />
        <span>{text(item.label, locale)}</span>
      </Link>
      {item.children?.length ? (
        <div className="ml-6 flex flex-col gap-1 border-l pl-3">
          {item.children.map((child) => (
            <Link
              key={child.href + child.label.en}
              href={child.href}
              onClick={onNavigate}
              className={cn(
                "rounded-lg px-3 py-2 text-xs text-muted-foreground",
                currentPage === child.page && "bg-muted text-foreground",
              )}
            >
              {text(child.label, locale)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
