"use client";

import { Input } from "@/components/ui/input";

export function ReminderTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="max-w-48" />;
}
