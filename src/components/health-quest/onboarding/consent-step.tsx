"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuestLocale } from "@/lib/health-quest/types";

export type OnboardingConsentState = {
  saveToSupabase: boolean;
  reminders: boolean;
  familySharingLater: boolean;
  analyticsPrivacyNoticeAcknowledged: boolean;
};

export function ConsentStep({
  consent,
  locale,
  onChange,
}: {
  consent: OnboardingConsentState;
  locale: QuestLocale;
  onChange: (consent: OnboardingConsentState) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="rounded-3xl border border-primary/20 bg-primary/8 p-4">
        <span className="flex items-center gap-2 font-semibold">
          <ShieldCheck aria-hidden="true" />
          {locale === "en" ? "Privacy and safety boundaries" : "私隱同安全界線"}
        </span>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {locale === "en"
            ? "We save preference-level answers only. No HKID, policy number, diagnosis, claim text, medication list, or raw sensitive notes are requested here."
            : "呢度只保存偏好級答案。不會要求 HKID、保單號碼、診斷、索償文字、藥物清單或原始敏感備註。"}
        </p>
      </div>
      <ConsentToggle
        checked={consent.saveToSupabase}
        label={locale === "en" ? "Save preferences to Supabase session" : "保存偏好到 Supabase session"}
        onClick={() => onChange({ ...consent, saveToSupabase: !consent.saveToSupabase })}
      />
      <ConsentToggle
        checked={consent.reminders}
        label={locale === "en" ? "Allow reminder preferences" : "允許提醒偏好"}
        onClick={() => onChange({ ...consent, reminders: !consent.reminders })}
      />
      <ConsentToggle
        checked={consent.familySharingLater}
        label={locale === "en" ? "Maybe set family sharing later" : "稍後可以設定家庭分享"}
        onClick={() => onChange({ ...consent, familySharingLater: !consent.familySharingLater })}
      />
      <ConsentToggle
        checked={consent.analyticsPrivacyNoticeAcknowledged}
        label={locale === "en" ? "I understand analytics are privacy-safe and stripped of sensitive text" : "我明白分析事件只記私隱安全資料，會移除敏感文字"}
        onClick={() => onChange({ ...consent, analyticsPrivacyNoticeAcknowledged: !consent.analyticsPrivacyNoticeAcknowledged })}
      />
    </div>
  );
}

function ConsentToggle({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={checked ? "default" : "outline"}
      className="min-h-14 justify-start rounded-2xl text-left whitespace-normal"
      onClick={onClick}
    >
      {checked ? "✓" : "○"}
      {label}
    </Button>
  );
}
