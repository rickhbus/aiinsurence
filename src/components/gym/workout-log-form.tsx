"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useHealthOsSubmit } from "@/components/health-os/client-submit";
import type { GymAnalysis } from "@/lib/health-os/types";
import { ExerciseSetEditor } from "./exercise-set-editor";
import { WorkoutSummaryCard } from "./workout-summary-card";

export function WorkoutLogForm() {
  const { saving, submit } = useHealthOsSubmit();
  const [analysis, setAnalysis] = useState<GymAnalysis | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const sets = [0, 1, 2]
      .map((index) => ({
        exerciseName: stringValue(data.get(`exerciseName-${index}`)),
        muscleGroup: stringValue(data.get(`muscleGroup-${index}`)),
        setNumber: index + 1,
        reps: numberValue(data.get(`reps-${index}`)),
        weightKg: numberValue(data.get(`weightKg-${index}`)),
        rpe: numberValue(data.get(`rpe-${index}`)),
        painFlag: data.get(`painFlag-${index}`) === "on",
        completed: true,
      }))
      .filter((set) => set.exerciseName);
    const body = await submit({
      endpoint: "/api/gym/workouts",
      payload: {
        workoutType: stringValue(data.get("workoutType")),
        durationMinutes: numberValue(data.get("durationMinutes")),
        targetMuscleGroups: stringValue(data.get("targetMuscleGroups")).split(",").map((item) => item.trim()).filter(Boolean),
        intensity: numberValue(data.get("intensity")),
        sorenessBefore: numberValue(data.get("sorenessBefore")),
        sorenessAfter: numberValue(data.get("sorenessAfter")),
        energyBefore: numberValue(data.get("energyBefore")),
        moodBefore: numberValue(data.get("moodBefore")),
        moodAfter: numberValue(data.get("moodAfter")),
        painFlag: data.get("painFlag") === "on",
        redFlagSymptoms: stringValue(data.get("redFlagSymptoms")).split(",").map((item) => item.trim()).filter(Boolean),
        sleepMinutes: numberValue(data.get("sleepMinutes")),
        stressScore: numberValue(data.get("stressScore")),
        notes: stringValue(data.get("notes")),
        sets,
      },
      successZh: "已保存健身紀錄。",
    });

    if (body?.analysis) {
      setAnalysis(body.analysis);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Gym Workout Coach</CardTitle>
            <CardDescription>先處理胸痛、暈眩、呼吸困難、劇痛等紅旗，再提供訓練建議。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-4">
              <Field name="workoutType" label="type" placeholder="Push / Full body" />
              <Field name="durationMinutes" label="duration" type="number" />
              <Field name="targetMuscleGroups" label="muscles" placeholder="chest, back" />
              <Field name="intensity" label="intensity 1-10" type="number" />
              <Field name="sorenessBefore" label="soreness before" type="number" />
              <Field name="sorenessAfter" label="soreness after" type="number" />
              <Field name="energyBefore" label="energy before" type="number" />
              <Field name="moodAfter" label="mood after" type="number" />
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">Exercise sets</p>
              {[0, 1, 2].map((index) => <ExerciseSetEditor key={index} index={index} />)}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field name="sleepMinutes" label="sleep minutes" type="number" />
              <Field name="stressScore" label="stress 1-10" type="number" />
              <label className="flex items-center gap-2 text-sm"><input name="painFlag" type="checkbox" /> pain flag</label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              red flag symptoms
              <Input name="redFlagSymptoms" placeholder="chest pain, severe dizziness" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              notes
              <Textarea name="notes" />
            </label>
          </CardContent>
          <CardFooter>
            <Button disabled={saving}>{saving ? "保存中" : "保存訓練"}</Button>
          </CardFooter>
        </form>
      </Card>
      <WorkoutSummaryCard analysis={analysis} />
    </div>
  );
}

function Field({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} type={type} placeholder={placeholder} inputMode={type === "number" ? "decimal" : undefined} />
    </label>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const number = Number(stringValue(value));

  return Number.isFinite(number) && stringValue(value) !== "" ? number : undefined;
}
