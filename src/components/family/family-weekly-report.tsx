"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeCard } from "@/components/payments/upgrade-card";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import type { FamilyWeeklyReport as FamilyWeeklyReportType } from "@/lib/family/family-weekly-report";

type WeeklyReportState =
  | { paid: false; preview: string; report: { checkInDays: number } }
  | { paid: true; report: FamilyWeeklyReportType };

export function FamilyWeeklyReport() {
  const [state, setState] = useState<WeeklyReportState | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
      const response = await fetch("/api/family/weekly-report", { headers });
      const body = await response.json().catch(() => null);

      if (active && response.ok) {
        setState(body);
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, []);

  if (!state) {
    return null;
  }

  if (!state.paid) {
    return <UpgradeCard title="家庭週報 / Family weekly report" body={state.preview} />;
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>家庭週報 / Family weekly report</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
        <p>Check-in days: {state.report.checkInDays}</p>
        <p>Missed check-in days: {state.report.missedCheckInDays}</p>
        <p>Not-feeling-well days: {state.report.notFeelingWellDays}</p>
        <p>Red-flag count: {state.report.redFlagCount}</p>
        <p>Doctor appointments: {state.report.doctorAppointments}</p>
        <p>{state.report.caregiverSuggestionZh}</p>
      </CardContent>
    </Card>
  );
}
