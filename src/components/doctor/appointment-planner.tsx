"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

type AppointmentRow = {
  id: string;
  appointment_date: string;
  clinic_name: string | null;
  doctor_name: string | null;
  reason: string | null;
  questions: string[] | null;
  documents_to_bring: string[] | null;
};

export function AppointmentPlanner() {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [reason, setReason] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [documentsText, setDocumentsText] = useState("");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [busy, setBusy] = useState(false);

  const canSave = useMemo(() => Boolean(appointmentDate), [appointmentDate]);

  async function loadAppointments() {
    const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
    const response = await fetch("/api/doctor/appointments", { headers });
    const body = await response.json().catch(() => null);

    if (response.ok) {
      setAppointments(body.appointments ?? []);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAppointments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function saveAppointment() {
    if (!canSave) {
      return;
    }

    setBusy(true);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      await fetch("/api/doctor/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          appointmentDate: new Date(appointmentDate).toISOString(),
          clinicName: clinicName || null,
          doctorName: doctorName || null,
          reason: reason || null,
          questions: splitLines(questionsText),
          documentsToBring: splitLines(documentsText),
        }),
      });
      setQuestionsText("");
      setDocumentsText("");
      await loadAppointments();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
      <CardHeader>
        <CardTitle>準備覆診 / Prepare visit</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            type="datetime-local"
            value={appointmentDate}
            onChange={(event) => setAppointmentDate(event.target.value)}
            aria-label="Appointment date"
          />
          <Input
            value={clinicName}
            onChange={(event) => setClinicName(event.target.value)}
            placeholder="診所 / Clinic"
          />
          <Input
            value={doctorName}
            onChange={(event) => setDoctorName(event.target.value)}
            placeholder="醫生姓名 / Doctor"
          />
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="今次想問咩 / Reason"
          />
        </div>
        <Textarea
          value={questionsText}
          onChange={(event) => setQuestionsText(event.target.value)}
          placeholder="要問醫生的問題，一行一條"
        />
        <Textarea
          value={documentsText}
          onChange={(event) => setDocumentsText(event.target.value)}
          placeholder="要帶文件，一行一項"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={!canSave || busy} onClick={saveAppointment} className="min-h-12">
            <CalendarPlus data-icon="inline-start" aria-hidden="true" />
            Add appointment
          </Button>
          <Button asChild variant="outline" className="min-h-12">
            <Link href="/api/doctor/report" target="_blank" rel="noreferrer">
              準備覆診 / Prepare visit
            </Link>
          </Button>
        </div>
        <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-xl bg-muted/30 p-3">
              <p>{new Date(appointment.appointment_date).toLocaleString("zh-HK")}</p>
              <p>{appointment.clinic_name ?? "診所未填"} {appointment.doctor_name ?? ""}</p>
              {(appointment.questions ?? []).length > 0 ? <p>問題: {(appointment.questions ?? []).join("、")}</p> : null}
            </div>
          ))}
          {appointments.length === 0 ? <p>未有覆診安排。</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}
