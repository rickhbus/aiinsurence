import type { LocalizedText } from "./types";

export const healthLeagueNames = ["Starter", "Bronze", "Silver", "Gold", "Jade", "Ruby", "Diamond"] as const;
export type HealthLeagueName = typeof healthLeagueNames[number];

export type LeagueMember = {
  userId: string;
  displayName: string;
  leagueName: HealthLeagueName;
  weekStart: string;
  xp: number;
  rank?: number | null;
};

export type LeagueZone = "promotion" | "safe" | "demotion";

export type LeagueStanding = LeagueMember & {
  rank: number;
  zone: LeagueZone;
};

export const leagueCopy: Record<HealthLeagueName, LocalizedText> = {
  Starter: { zh: "起步", en: "Starter" },
  Bronze: { zh: "青銅", en: "Bronze" },
  Silver: { zh: "白銀", en: "Silver" },
  Gold: { zh: "黃金", en: "Gold" },
  Jade: { zh: "翡翠", en: "Jade" },
  Ruby: { zh: "紅寶", en: "Ruby" },
  Diamond: { zh: "鑽石", en: "Diamond" },
};

export function getLeagueForXp(xp: number): HealthLeagueName {
  if (xp >= 2600) return "Diamond";
  if (xp >= 1800) return "Ruby";
  if (xp >= 1200) return "Jade";
  if (xp >= 700) return "Gold";
  if (xp >= 350) return "Silver";
  if (xp >= 100) return "Bronze";
  return "Starter";
}

export function getWeekStart(date = new Date()) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);

  return copy.toISOString().slice(0, 10);
}

export function buildLeagueStandings(members: LeagueMember[]): LeagueStanding[] {
  const sorted = [...members].sort((a, b) => b.xp - a.xp || a.displayName.localeCompare(b.displayName));
  const total = sorted.length;
  const promotionCutoff = Math.max(1, Math.ceil(total * 0.2));
  const demotionStart = total >= 10 ? Math.floor(total * 0.8) + 1 : Number.POSITIVE_INFINITY;

  return sorted.map((member, index) => {
    const rank = index + 1;
    const zone: LeagueZone = rank <= promotionCutoff
      ? "promotion"
      : rank >= demotionStart
        ? "demotion"
        : "safe";

    return { ...member, rank, zone };
  });
}

export function anonymizeLeagueName(userId: string, displayName?: string | null) {
  const clean = displayName?.trim();
  if (clean) {
    return clean.slice(0, 32);
  }

  const suffix = userId.replace(/-/g, "").slice(-4).toUpperCase() || "0000";
  return `Health Player ${suffix}`;
}

export function sanitizeLeagueMember(row: Record<string, unknown>): LeagueMember {
  const xp = Number(row.xp ?? 0);
  const leagueName = healthLeagueNames.includes(row.league_name as HealthLeagueName)
    ? row.league_name as HealthLeagueName
    : getLeagueForXp(xp);

  return {
    userId: String(row.user_id ?? ""),
    displayName: anonymizeLeagueName(String(row.user_id ?? ""), typeof row.display_name === "string" ? row.display_name : null),
    leagueName,
    weekStart: String(row.week_start ?? getWeekStart()),
    xp: Math.max(0, Math.round(xp)),
    rank: typeof row.rank === "number" ? row.rank : null,
  };
}

