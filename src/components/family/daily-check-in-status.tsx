"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyCheckInStatus as DailyCheckInStatusType } from "@/lib/family/check-in-status";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

export function DailyCheckInStatus() {
  const [status, setStatus] = useState<DailyCheckInStatusType | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
        const response = await fetch("/api/family", { headers });
        const body = await response.json().catch(() => null);

        if (active && response.ok) {
          setStatus(body.checkInStatus ?? null);
        }
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>今日爸媽有冇 check-in?</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-base leading-7">
        <p>今日狀態: {status?.statusLabelZh ?? (loaded ? "未 check-in" : "載入中")}</p>
        <p>最後記錄時間: {formatLastRecord(status?.lastRecordAt)}</p>
        <p>是否需要關心: {status?.needsCare ? "可以關心一下" : "暫時無需要"}</p>
        <p>{status?.notFeelingWell ? "今日話唔舒服" : "無話唔舒服"}</p>
        <p>{status?.redFlagLabelZh ?? "無紅旗提示"}</p>
      </CardContent>
    </Card>
  );
}

function formatLastRecord(value: string | null | undefined) {
  if (!value) {
    return "未有記錄";
  }

  return new Date(value).toLocaleString("zh-HK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
