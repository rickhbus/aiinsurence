export const familyShareScopes = [
  "safety_status",
  "daily_checkin_completion",
  "emergency_contact",
  "hydration_summary",
  "meal_summary",
  "workout_summary",
  "mood_summary",
] as const;

export type FamilyShareScope = typeof familyShareScopes[number];

export const defaultFamilyShareScopes: FamilyShareScope[] = [
  "safety_status",
  "daily_checkin_completion",
];

const allowedScopes = new Set<FamilyShareScope>(familyShareScopes);

export function normalizeFamilyShareScopes(scopes: unknown): FamilyShareScope[] {
  if (!Array.isArray(scopes)) {
    return defaultFamilyShareScopes;
  }

  const normalized = scopes
    .filter((scope): scope is FamilyShareScope =>
      typeof scope === "string" && allowedScopes.has(scope as FamilyShareScope),
    )
    .filter((scope, index, all) => all.indexOf(scope) === index);

  return normalized.length > 0 ? normalized : defaultFamilyShareScopes;
}

export function canAccessFamilyScope({
  scopes,
  revokedAt,
  scope,
}: {
  scopes: string[] | null | undefined;
  revokedAt?: string | null;
  scope: FamilyShareScope;
}) {
  if (revokedAt) {
    return false;
  }

  return normalizeFamilyShareScopes(scopes).includes(scope);
}
