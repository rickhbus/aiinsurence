import type { SupabaseClient } from "@supabase/supabase-js";

export type HealthDataClient = Pick<SupabaseClient, "from">;

export function assertUserId(userId: string | null | undefined) {
  if (!userId || userId.trim().length === 0) {
    throw new Error("userId is required for health data operations.");
  }
}

export function throwIfSupabaseError(
  error: { message: string } | null,
  action: string,
) {
  if (error) {
    throw new Error(`Could not ${action}: ${error.message}`);
  }
}

export function getDayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    date: toDateKey(start),
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function getWeekBounds(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return {
    weekStart: toDateKey(start),
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toNumber(value: number | string | null | undefined) {
  if (value == null) {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeLimit(limit: number | undefined, fallback = 20, max = 100) {
  if (!limit || !Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(max, Math.floor(limit)));
}
