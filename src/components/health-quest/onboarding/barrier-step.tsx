"use client";

import { BatteryLow, BellOff, EyeOff, HelpCircle, ShieldAlert, Timer, Users } from "lucide-react";
import type { QuestLocale } from "@/lib/health-quest/types";
import { StepCards } from "./step-card";

const options = [
  { value: "i_forget", icon: BellOff, label: { zh: "我會唔記得", en: "I forget" }, description: { zh: "可以用安全提醒和最短路線。", en: "Use safe reminders and the shortest path." } },
  { value: "too_tired", icon: BatteryLow, label: { zh: "太攰", en: "Too tired" }, description: { zh: "恢復和輕量任務都會計。", en: "Recovery and gentle quests count." } },
  { value: "dont_know_what_to_do", icon: HelpCircle, label: { zh: "唔知做咩", en: "I do not know what to do" }, description: { zh: "每次只給下一個小步。", en: "You will get one tiny next step." } },
  { value: "lose_motivation", icon: HelpCircle, label: { zh: "容易無動力", en: "I lose motivation" }, description: { zh: "獎勵一致性，不追求完美。", en: "Consistency is rewarded, not perfection." } },
  { value: "symptoms_worry_me", icon: ShieldAlert, label: { zh: "症狀令我擔心", en: "Symptoms worry me" }, description: { zh: "安全提示永遠優先，不會遊戲化緊急情況。", en: "Safety always comes first; emergencies are never gamified." } },
  { value: "need_family_support", icon: Users, label: { zh: "需要屋企人支持", en: "I need family support" }, description: { zh: "之後可選擇只分享進度。", en: "You can later share progress only." } },
  { value: "too_busy", icon: Timer, label: { zh: "太忙", en: "Too busy" }, description: { zh: "任務會保持 90 秒內可完成。", en: "Quests stay possible within 90 seconds." } },
  { value: "privacy_concern", icon: EyeOff, label: { zh: "擔心私隱", en: "Privacy concern" }, description: { zh: "不問 HKID、保單號碼或原始敏感備註。", en: "No HKID, policy number, or raw sensitive notes." } },
];

export function BarrierStep({ value, locale, onChange }: { value: string; locale: QuestLocale; onChange: (value: string) => void }) {
  return <StepCards options={options} value={value} locale={locale} onChange={onChange} />;
}
