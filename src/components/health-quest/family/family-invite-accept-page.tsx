"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

export function FamilyInviteAcceptPage({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "accepted" | "error">("idle");

  async function acceptInvite() {
    setStatus("saving");
    const headers = await getSupabaseRequestHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    const response = await fetch("/api/health-quest/family-circle/invite/accept", {
      method: "POST",
      headers,
      body: JSON.stringify({ token }),
    });

    setStatus(response.ok ? "accepted" : "error");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-5 px-4 py-8">
      <section className="rounded-2xl border border-border/60 bg-card/85 p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-normal">加入家庭任務圈 / Join Family Quest Circle</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          只會加入進度分享圈；邀請不包含健康、症狀、醫生、保險或身份資料。 / This invite only joins a progress-sharing circle and does not include health, symptom, doctor, insurance, or identity details.
        </p>
        <Button type="button" className="mt-5 min-h-12 w-full" onClick={acceptInvite} disabled={status === "saving" || status === "accepted"}>
          {status === "accepted" ? <CheckCircle2 data-icon="inline-start" aria-hidden="true" /> : null}
          {status === "saving" ? "處理中 / Joining..." : status === "accepted" ? "已加入 / Joined" : "接受邀請 / Accept invite"}
        </Button>
        {status === "error" ? (
          <p className="mt-3 text-sm text-destructive">
            邀請已過期、已撤回或需要重新登入。 / This invite is expired, revoked, or needs a fresh sign-in.
          </p>
        ) : null}
      </section>
    </div>
  );
}
