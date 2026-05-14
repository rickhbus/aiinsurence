import type { LocalizedText, QuestLocale } from "./types";

export const healthQuestPlaySystem = {
  name: "Health Quest Play System",
  identity: {
    mascot: { zh: "AI 小健龜", en: "AI Turtle Coach" },
    app: { zh: "小健龜智健任務", en: "Turtle Health Quest" },
    league: { zh: "翡翠聯賽", en: "Jade League" },
  },
  safeDefaults: {
    streak: 0,
    xp: 0,
    gems: 12,
  },
  colors: {
    primary: {
      jade: "#109c91",
      jadeDark: "#08756f",
      jadeSoft: "#d8f5ef",
    },
    secondary: {
      sky: "#3aa7e8",
      skySoft: "#dff3ff",
    },
    accent: {
      amber: "#f2ad2e",
      amberSoft: "#fff2cf",
    },
    success: {
      emerald: "#16a66a",
      emeraldSoft: "#ddf8e9",
    },
    recovery: {
      amber: "#d99a22",
      amberSoft: "#fff2d7",
    },
    safety: {
      red: "#d93f3f",
      redSoft: "#ffe1e1",
    },
    surface: {
      light: "#fbfdf9",
      dark: "#111d2d",
    },
  },
  radius: {
    card: "rounded-[1.4rem]",
    control: "rounded-2xl",
    node: "rounded-full",
  },
  shadow: {
    soft: "shadow-[0_10px_30px_rgba(15,118,110,0.12)]",
    node: "shadow-[0_12px_26px_rgba(15,118,110,0.25)]",
    amber: "shadow-[0_12px_26px_rgba(217,154,34,0.22)]",
  },
} as const;

export const turtleCoachIdentity = healthQuestPlaySystem.identity;
export const safeGameStats = healthQuestPlaySystem.safeDefaults;

export type PlayTone =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "recovery"
  | "safety"
  | "muted";

export const playToneClasses: Record<PlayTone, {
  surface: string;
  solid: string;
  text: string;
  ring: string;
  border: string;
}> = {
  primary: {
    surface: "bg-teal-500/10 dark:bg-teal-400/10",
    solid: "bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-950",
    text: "text-teal-700 dark:text-teal-200",
    ring: "ring-teal-500/35",
    border: "border-teal-500/25",
  },
  secondary: {
    surface: "bg-sky-500/10 dark:bg-sky-400/10",
    solid: "bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950",
    text: "text-sky-700 dark:text-sky-200",
    ring: "ring-sky-500/35",
    border: "border-sky-500/25",
  },
  accent: {
    surface: "bg-amber-400/16 dark:bg-amber-300/12",
    solid: "bg-amber-500 text-slate-950",
    text: "text-amber-800 dark:text-amber-200",
    ring: "ring-amber-400/40",
    border: "border-amber-400/35",
  },
  success: {
    surface: "bg-emerald-500/10 dark:bg-emerald-400/10",
    solid: "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950",
    text: "text-emerald-700 dark:text-emerald-200",
    ring: "ring-emerald-500/35",
    border: "border-emerald-500/25",
  },
  recovery: {
    surface: "bg-orange-400/12 dark:bg-orange-300/10",
    solid: "bg-orange-400 text-slate-950",
    text: "text-orange-800 dark:text-orange-200",
    ring: "ring-orange-400/35",
    border: "border-orange-400/30",
  },
  safety: {
    surface: "bg-red-500/10 dark:bg-red-400/10",
    solid: "bg-red-600 text-white dark:bg-red-500 dark:text-white",
    text: "text-red-700 dark:text-red-200",
    ring: "ring-red-500/35",
    border: "border-red-500/25",
  },
  muted: {
    surface: "bg-muted/55",
    solid: "bg-muted text-muted-foreground",
    text: "text-muted-foreground",
    ring: "ring-border/60",
    border: "border-border/60",
  },
};

export function questText(value: LocalizedText, locale: QuestLocale) {
  if (locale === "en") {
    return value.en;
  }

  if (locale === "bilingual") {
    return `${value.zh} / ${value.en}`;
  }

  return value.zh;
}
