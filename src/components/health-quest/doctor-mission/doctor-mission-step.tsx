"use client";

import { DoctorQuestionCard } from "./doctor-question-card";

export function DoctorMissionStep({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <DoctorQuestionCard label={label} value={value} onChange={onChange} />;
}
