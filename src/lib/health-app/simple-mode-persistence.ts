export type SimpleModeCheckInAction =
  | "wake"
  | "food"
  | "water"
  | "toilet"
  | "move"
  | "sick"
  | "good"
  | "okay"
  | "not-good";

type SimpleDailyCheckInPayload = Record<string, unknown> & {
  checkin_type: "wake_up" | "meal" | "water" | "exercise" | "health_review";
  label: string;
  note?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

type SaveSimpleModeActionOptions = {
  action: SimpleModeCheckInAction;
  endpoint: string;
  payload: Record<string, unknown>;
  checkInMetadata?: Record<string, string | number | boolean | null>;
  checkInNote?: string | null;
  postJson: (endpoint: string, payload: Record<string, unknown>) => Promise<boolean>;
};

export function getSimpleDailyCheckInPayload(
  action: SimpleModeCheckInAction,
): SimpleDailyCheckInPayload {
  const payloads: Record<SimpleModeCheckInAction, SimpleDailyCheckInPayload> = {
    wake: {
      checkin_type: "wake_up",
      label: "起身",
      metadata: { source: "simple_today", simpleModeAction: action },
    },
    food: {
      checkin_type: "meal",
      label: "食咗",
      metadata: { source: "simple_today", simpleModeAction: action },
    },
    water: {
      checkin_type: "water",
      label: "飲咗水",
      metadata: { source: "simple_today", simpleModeAction: action },
    },
    toilet: {
      checkin_type: "health_review",
      label: "去廁所",
      metadata: { source: "simple_today", simpleModeAction: action },
    },
    move: {
      checkin_type: "exercise",
      label: "郁咗",
      metadata: { source: "simple_today", simpleModeAction: action },
    },
    sick: {
      checkin_type: "health_review",
      label: "唔舒服",
      metadata: { source: "simple_today", simpleModeAction: action },
    },
    good: {
      checkin_type: "health_review",
      label: "好",
      metadata: { source: "simple_today", simpleModeAction: action },
    },
    okay: {
      checkin_type: "health_review",
      label: "一般",
      metadata: { source: "simple_today", simpleModeAction: action },
    },
    "not-good": {
      checkin_type: "health_review",
      label: "唔舒服",
      metadata: {
        source: "simple_today",
        simpleModeAction: action,
        notFeelingWell: true,
      },
    },
  };

  return payloads[action];
}

export async function saveSimpleModeAction({
  action,
  payload,
  checkInMetadata,
  checkInNote,
  postJson,
}: SaveSimpleModeActionOptions) {
  const saved = await postJson(
    "/api/life-tracker/log",
    getSimpleLifeTrackerPayload({ action, payload, checkInMetadata, checkInNote }),
  );

  return {
    saved,
    detailSaved: saved,
    checkInSaved: saved,
  };
}

export function getSimpleLifeTrackerPayload({
  action,
  payload,
  checkInMetadata,
  checkInNote,
}: Pick<SaveSimpleModeActionOptions, "action" | "payload" | "checkInMetadata" | "checkInNote">) {
  const occurredAt = stringValue(payload.wakeTime) ?? stringValue(payload.loggedAt) ?? stringValue(payload.startedAt);
  const details = checkInMetadata ?? {};
  const base = stripNullable({
    occurredAt,
    note: checkInNote ?? stringValue(payload.notes) ?? stringValue(payload.description),
  });

  switch (action) {
    case "wake":
      return { ...base, action: "wake" };
    case "water":
      return {
        ...base,
        action: "water",
        amount: numberValue(payload.waterMl) ?? numberValue(payload.amount_ml) ?? 250,
        unit: "ml",
      };
    case "food":
      return {
        ...base,
        action: "meal",
        details: {
          ...details,
          mealType: stringValue(payload.mealType) ?? "snack",
          foodName: stringValue(payload.description) ?? "食咗 / I ate",
        },
      };
    case "toilet":
      return {
        ...base,
        action: "toilet",
        details: {
          ...details,
          bowelMovement: booleanValue(payload.bowelMovement) ?? true,
          urineColor: stringValue(payload.urineColor) ?? "unknown",
        },
      };
    case "move":
      return { ...base, action: "move", details };
    case "sick":
      return { ...base, action: "sick", details };
    case "good":
    case "okay":
    case "not-good":
      return {
        ...base,
        action: "mood",
        details: {
          ...details,
          userText: stringValue(payload.userText) ?? getSimpleDailyCheckInPayload(action).label,
          moodScore: numberValue(payload.moodScore),
          stressScore: numberValue(payload.stressScore),
          energyScore: numberValue(payload.energyScore),
          emotionLabel: stringValue(payload.emotionLabel),
        },
      };
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

  return Number.isFinite(number) ? number : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function stripNullable(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined),
  );
}
