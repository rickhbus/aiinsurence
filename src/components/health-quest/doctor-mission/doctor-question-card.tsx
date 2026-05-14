"use client";

import { Textarea } from "@/components/ui/textarea";

export function DoctorQuestionCard({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 rounded-3xl border border-border/60 bg-card/86 p-4">
      <span className="font-medium">{label}</span>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} maxLength={1000} />
    </label>
  );
}
