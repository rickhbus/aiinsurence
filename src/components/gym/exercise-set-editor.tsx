import { Input } from "@/components/ui/input";

export function ExerciseSetEditor({ index }: { index: number }) {
  return (
    <div className="grid gap-2 rounded-xl bg-muted/30 p-3 md:grid-cols-6">
      <Input name={`exerciseName-${index}`} placeholder="Exercise" defaultValue={index === 0 ? "Bench press" : undefined} />
      <Input name={`muscleGroup-${index}`} placeholder="Muscle" />
      <Input name={`reps-${index}`} type="number" placeholder="Reps" />
      <Input name={`weightKg-${index}`} type="number" placeholder="kg" />
      <Input name={`rpe-${index}`} type="number" min={1} max={10} placeholder="RPE" />
      <label className="flex items-center gap-2 text-sm"><input name={`painFlag-${index}`} type="checkbox" /> pain</label>
    </div>
  );
}
