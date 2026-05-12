import { canAccessFamilyScope } from "./sharing";

export const familyAlertTypes = [
  "check_in_help",
  "not_feeling_well",
  "family_message",
  "emergency_prompt",
] as const;

export type FamilyAlertType = typeof familyAlertTypes[number];

export const defaultFamilyAlertMessageZh: Record<FamilyAlertType, string> = {
  check_in_help: "想屋企人關心一下。",
  not_feeling_well: "今日話唔舒服，想屋企人關心一下。",
  family_message: "想通知屋企人。",
  emergency_prompt: "已顯示 999 緊急提示。",
};

export function buildFamilyAlertMessageZh(type: FamilyAlertType, messageZh?: string | null) {
  const cleanMessage = messageZh?.trim();

  return cleanMessage ? cleanMessage.slice(0, 240) : defaultFamilyAlertMessageZh[type];
}

export function canCaregiverReadFamilyAlert({
  role,
  scopes,
  revokedAt,
}: {
  role: string | null | undefined;
  scopes: string[] | null | undefined;
  revokedAt?: string | null;
}) {
  if (role !== "caregiver") {
    return false;
  }

  return (
    canAccessFamilyScope({ scopes, revokedAt, scope: "safety_status" }) ||
    canAccessFamilyScope({ scopes, revokedAt, scope: "emergency_contact" })
  );
}
