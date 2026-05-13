export type SimpleModeCheckInAction =
  | "food"
  | "water"
  | "toilet"
  | "move"
  | "good"
  | "okay"
  | "not-good";

type SimpleDailyCheckInPayload = Record<string, unknown> & {
  checkin_type: "meal" | "water" | "exercise" | "health_review";
  label: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type SaveSimpleModeActionOptions = {
  action: SimpleModeCheckInAction;
  endpoint: string;
  payload: Record<string, unknown>;
  postJson: (endpoint: string, payload: Record<string, unknown>) => Promise<boolean>;
};

export function getSimpleDailyCheckInPayload(
  action: SimpleModeCheckInAction,
): SimpleDailyCheckInPayload {
  const payloads: Record<SimpleModeCheckInAction, SimpleDailyCheckInPayload> = {
    food: {
      checkin_type: "meal",
      label: "食咗嘢",
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
      label: "郁咗一陣",
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
  endpoint,
  payload,
  postJson,
}: SaveSimpleModeActionOptions) {
  const checkInPayload = getSimpleDailyCheckInPayload(action);
  const [detailSaved, checkInSaved] = await Promise.all([
    postJson(endpoint, payload),
    postJson("/api/daily/checkins", checkInPayload),
  ]);

  return {
    saved: detailSaved || checkInSaved,
    detailSaved,
    checkInSaved,
  };
}
