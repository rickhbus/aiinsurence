export const userModeStorageKey = "userMode";

export const userModes = ["self", "parent", "caregiver"] as const;

export type UserMode = typeof userModes[number];

const validUserModes = new Set<string>(userModes);

export function normalizeUserMode(value: unknown): UserMode | null {
  return typeof value === "string" && validUserModes.has(value)
    ? (value as UserMode)
    : null;
}

export function shouldRecommendFamilyCare(mode: UserMode | null) {
  return mode === "parent" || mode === "caregiver";
}
