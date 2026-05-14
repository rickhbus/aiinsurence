"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuestLocale } from "@/lib/health-quest/types";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import { FamilyChallengeCard } from "./family-challenge-card";
import { FamilyInviteDialog } from "./family-invite-dialog";
import { FamilyMemberCard } from "./family-member-card";
import { FamilyPermissionCard } from "./family-permission-card";
import { FamilyPrivacyExplainer } from "./family-privacy-explainer";

export function FamilyCirclePage({ locale = "zh-Hant" }: { locale?: QuestLocale }) {
  const [circleId, setCircleId] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function createCircle() {
    try {
      const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
      const response = await fetch("/api/health-quest/family-circle", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Health Quest Family" }),
      });
      const body = await response.json();
      setCircleId(body.circle?.id ?? null);
      toast.success(locale === "en" ? "Family circle ready." : "家庭圈已建立。");
    } catch {
      toast.message(locale === "en" ? "Family circle preview is available locally." : "可先預覽家庭圈。");
    }
  }

  async function invite(email: string) {
    if (!circleId) {
      toast.error(locale === "en" ? "Create a circle first." : "請先建立家庭圈。");
      return;
    }

    const headers = await getSupabaseRequestHeaders({ "Content-Type": "application/json", Accept: "application/json" });
    const response = await fetch("/api/health-quest/family-circle/invite", {
      method: "POST",
      headers,
      body: JSON.stringify({ circleId, email }),
    }).catch(() => undefined);
    const body = response?.ok ? await response.json().catch(() => null) : null;
    setInviteUrl(body?.invite?.inviteUrl ?? null);
    toast.success(locale === "en" ? "Invite saved." : "邀請已保存。");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5">
        <Badge variant="secondary" className="mb-3">
          <Users data-icon="inline-start" aria-hidden="true" />
          Family
        </Badge>
        <h1 className="text-3xl font-bold tracking-normal">{locale === "en" ? "Family Support Circle" : "家庭支援圈"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {locale === "en" ? "Keep loved ones encouraged without exposing private health details." : "鼓勵屋企人保持節奏，但唔公開私人健康細節。"}
        </p>
      </section>
      <FamilyPrivacyExplainer locale={locale} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={createCircle}>{locale === "en" ? "Create circle" : "建立家庭圈"}</Button>
        <FamilyInviteDialog locale={locale} onInvite={invite} />
      </div>
      {inviteUrl ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4 text-sm leading-6 text-muted-foreground">
          <p>{locale === "en" ? "Email delivery is not configured yet. Share this invite link manually; it contains no health details." : "電郵發送尚未設定。請手動分享邀請連結；連結不包含健康資料。"}</p>
          <code className="mt-2 block overflow-x-auto rounded-lg bg-muted p-3 text-xs text-foreground">{inviteUrl}</code>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <FamilyMemberCard name="You" detail={locale === "en" ? "streak-only sharing" : "只分享連續紀錄"} />
        <FamilyPermissionCard level="streak_only" locale={locale} />
        <FamilyChallengeCard type="water_7_day" progress={3} locale={locale} />
        <FamilyChallengeCard type="three_lessons_together" progress={1} locale={locale} />
      </div>
    </div>
  );
}
