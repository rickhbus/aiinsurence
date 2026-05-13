import { z } from "zod";
import type { LifeTrackerLogInput } from "@/lib/health-data/life-tracker";
import { questTypeToLifeTrackerAction } from "@/lib/health-quest/quest-engine";
import { logQuestReviewCheckin, loadOrCreateTodayQuestState } from "@/lib/health-quest/server";
import {
  insertXPEvent,
  loadQuestById,
  markQuestDone,
  saveQuestLifeTrackerLog,
} from "@/lib/health-quest/storage";
import { runCompletionSafetyGate } from "@/lib/health-quest/safety-gates";
import { buildXPEvent } from "@/lib/health-quest/xp";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const completeQuestSchema = z.object({
  questId: z.string().trim().min(1),
  actionPayload: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, completeQuestSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const quest = await loadQuestById(auth.supabase, auth.user.id, parsed.data.questId);

    if (!quest) {
      return jsonWithRequestId({ error: "Quest not found." }, { status: 404 }, requestId);
    }

    const gate = runCompletionSafetyGate({
      quest,
      actionPayload: parsed.data.actionPayload,
    });

    if (gate.urgent) {
      return jsonWithRequestId(
        {
          error: "Safety guidance must come before normal quest completion.",
          safetyMessage: gate.message,
        },
        { status: 409 },
        requestId,
      );
    }

    const now = new Date().toISOString();

    if (quest.status !== "done") {
      const lifeTrackerAction = questTypeToLifeTrackerAction(quest.type);

      if (lifeTrackerAction) {
        await saveQuestLifeTrackerLog({
          supabase: auth.supabase,
          userId: auth.user.id,
          input: buildLifeTrackerInput(lifeTrackerAction, parsed.data.actionPayload, now),
        });
      } else {
        await logQuestReviewCheckin({
          supabase: auth.supabase,
          userId: auth.user.id,
          questType: quest.type,
          occurredAt: now,
        });
      }

      const completed = await markQuestDone(auth.supabase, auth.user.id, quest.id, now);
      const event = buildXPEvent({ quest: completed, now });
      await insertXPEvent(auth.supabase, auth.user.id, event, {
        questType: completed.type,
        source: "health_quest",
      });
    }

    const state = await loadOrCreateTodayQuestState({
      supabase: auth.supabase,
      userId: auth.user.id,
      localDate: quest.localDate,
    });

    return jsonWithRequestId({ state }, undefined, requestId);
  } catch {
    return jsonWithRequestId(
      { error: "Quest completion is temporarily unavailable." },
      { status: 500 },
      requestId,
    );
  }
}

function buildLifeTrackerInput(
  action: NonNullable<ReturnType<typeof questTypeToLifeTrackerAction>>,
  payload: Record<string, unknown>,
  now: string,
): LifeTrackerLogInput {
  if (action === "water") {
    return {
      action,
      occurredAt: now,
      note: null,
      amount: 250,
      unit: "ml",
      details: { source: "health_quest" },
    };
  }

  if (action === "meal") {
    return {
      action,
      occurredAt: now,
      note: "食咗 / I ate",
      details: {
        mealType: "snack",
        foodName: "食咗 / I ate",
        source: "health_quest",
      },
    };
  }

  if (action === "mood") {
    const details = typeof payload.details === "object" && payload.details !== null
      ? payload.details as Record<string, unknown>
      : {};

    return {
      action,
      occurredAt: now,
      note: null,
      details: {
        moodScore: safeNumber(details.moodScore, 5),
        stressScore: safeNumber(details.stressScore, 5),
        energyScore: safeNumber(details.energyScore, 5),
        emotionLabel: "neutral",
        triggerCategory: "unknown",
        bodyLinks: [],
        userText: "Daily Health Quest mood check",
      },
    };
  }

  if (action === "move") {
    return {
      action,
      occurredAt: now,
      note: "郁咗 / I moved",
      details: {
        date: now.slice(0, 10),
        source: "health_quest",
      },
    };
  }

  return {
    action,
    occurredAt: now,
    note: null,
    details: {
      source: "health_quest",
    },
  };
}

function safeNumber(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

  return Number.isFinite(number) ? Math.max(1, Math.min(10, Math.round(number))) : fallback;
}
