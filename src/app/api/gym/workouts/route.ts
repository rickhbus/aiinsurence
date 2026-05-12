import { analyzeGymWorkout } from "@/lib/health-os/gym-coach";
import { gymWorkoutSchema } from "@/lib/health-os/validators";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("gym_workouts")
    .select("*, gym_exercise_sets(*)")
    .eq("user_id", auth.user.id)
    .order("workout_date", { ascending: false })
    .limit(30);

  if (error) {
    return jsonWithRequestId({ error: "暫時未能載入訓練紀錄。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ workouts: data ?? [] }, undefined, requestId);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, gymWorkoutSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const analysis = analyzeGymWorkout(parsed.data);
  const { data: workout, error } = await auth.supabase
    .from("gym_workouts")
    .insert({
      user_id: auth.user.id,
      workout_date: parsed.data.workoutDate,
      started_at: parsed.data.startedAt,
      ended_at: parsed.data.endedAt,
      duration_minutes: parsed.data.durationMinutes,
      workout_type: parsed.data.workoutType,
      target_muscle_groups: parsed.data.targetMuscleGroups,
      intensity: parsed.data.intensity,
      soreness_before: parsed.data.sorenessBefore,
      soreness_after: parsed.data.sorenessAfter,
      energy_before: parsed.data.energyBefore,
      mood_before: parsed.data.moodBefore,
      mood_after: parsed.data.moodAfter,
      pain_flag: parsed.data.painFlag,
      safety_flag: analysis.safetyFlags[0] ?? null,
      ai_summary: analysis.workoutSummary,
      notes: parsed.data.notes,
    })
    .select("*")
    .single();

  if (error || !workout) {
    return jsonWithRequestId({ error: "暫時未能保存訓練紀錄。" }, { status: 500 }, requestId);
  }

  if (parsed.data.sets.length > 0) {
    const { error: setsError } = await auth.supabase
      .from("gym_exercise_sets")
      .insert(parsed.data.sets.map((set) => ({
        workout_id: workout.id,
        user_id: auth.user.id,
        exercise_name: set.exerciseName,
        muscle_group: set.muscleGroup,
        set_number: set.setNumber,
        reps: set.reps,
        weight_kg: set.weightKg,
        rpe: set.rpe,
        rest_seconds: set.restSeconds,
        pain_flag: set.painFlag,
        form_note: set.formNote,
        unilateral: set.unilateral,
        completed: set.completed,
      })));

    if (setsError) {
      return jsonWithRequestId({ error: "訓練已保存，但組數暫時未能保存。" }, { status: 500 }, requestId);
    }
  }

  return jsonWithRequestId({ workout, analysis }, undefined, requestId);
}
