"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BigButton } from "@/components/simple-mode/big-button";
import type { SimpleSuggestionState } from "@/components/simple-mode/simple-suggestion";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

export function CallFamilyButton({
  disabled,
  onResult,
}: {
  disabled?: boolean;
  onResult: (result: SimpleSuggestionState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);

  async function callFamily() {
    setBusy(true);
    setSetupNeeded(false);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      const response = await fetch("/api/family/alert", {
        method: "POST",
        headers,
        body: JSON.stringify({
          alertType: "check_in_help",
          messageZh: "想屋企人關心一下。",
        }),
      });
      const body = await response.json().catch(() => null);

      if (response.ok) {
        onResult({
          confirmation: "通知咗屋企人",
          suggestion: "已經建立家庭提示。緊急情況請即刻打 999。",
        });
        return;
      }

      if (response.status === 404 || body?.code === "no_family_caregiver") {
        setSetupNeeded(true);
        onResult({
          confirmation: "未設定屋企人",
          suggestion: "未設定屋企人。你可以去家庭分享加入照顧者。",
          tone: "warning",
        });
        return;
      }

      onResult({
        confirmation: "暫時未能通知",
        suggestion: "請稍後再試。緊急情況請即刻打 999。",
        tone: "warning",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <BigButton
        emoji="👨‍👩‍👧"
        tone="soft"
        disabled={disabled || busy}
        onClick={callFamily}
      >
        {busy ? "通知中" : "叫屋企人"}
      </BigButton>
      {setupNeeded ? (
        <Button asChild variant="outline" size="lg" className="min-h-14 rounded-xl text-lg font-bold">
          <Link href="/family">去設定 / Set up</Link>
        </Button>
      ) : null}
    </div>
  );
}
