export type CheckInStatusRecord = {
  checkin_type?: string | null;
  label?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type CheckInAlertRecord = {
  alert_type?: string | null;
  created_at: string;
};

export type DailyCheckInStatus = {
  checkedIn: boolean;
  statusLabelZh: "已 check-in" | "未 check-in";
  notFeelingWell: boolean;
  redFlagDetected: boolean;
  redFlagLabelZh: "有紅旗提示" | "無紅旗提示";
  lastRecordAt: string | null;
  needsCare: boolean;
  visibleLinesZh: string[];
};

export function buildDailyCheckInStatus({
  checkins,
  alerts,
  now = new Date(),
}: {
  checkins: CheckInStatusRecord[];
  alerts?: CheckInAlertRecord[];
  now?: Date;
}): DailyCheckInStatus {
  const today = now.toISOString().slice(0, 10);
  const todayCheckins = checkins.filter((item) => item.created_at.slice(0, 10) === today);
  const todayAlerts = (alerts ?? []).filter((item) => item.created_at.slice(0, 10) === today);
  const notFeelingWell =
    todayAlerts.some((item) => item.alert_type === "not_feeling_well") ||
    todayCheckins.some((item) => item.metadata?.notFeelingWell === true);
  const redFlagDetected =
    todayAlerts.some((item) => item.alert_type === "emergency_prompt") ||
    todayCheckins.some((item) => item.metadata?.redFlag === true);
  const lastRecordAt = [...todayCheckins, ...todayAlerts]
    .map((item) => item.created_at)
    .sort()
    .at(-1) ?? null;
  const checkedIn = todayCheckins.length > 0;

  return {
    checkedIn,
    statusLabelZh: checkedIn ? "已 check-in" : "未 check-in",
    notFeelingWell,
    redFlagDetected,
    redFlagLabelZh: redFlagDetected ? "有紅旗提示" : "無紅旗提示",
    lastRecordAt,
    needsCare: !checkedIn || notFeelingWell || redFlagDetected,
    visibleLinesZh: [
      "今日狀態:",
      checkedIn ? "已 check-in" : "未 check-in",
      notFeelingWell ? "今日話唔舒服" : "無話唔舒服",
      redFlagDetected ? "有紅旗提示" : "無紅旗提示",
    ],
  };
}
