import type { CheckInAlertRecord, CheckInStatusRecord } from "./check-in-status";

export type FamilyWeeklyAppointment = {
  appointment_date: string;
};

export type FamilyWeeklyReport = {
  checkInDays: number;
  missedCheckInDays: number;
  notFeelingWellDays: number;
  redFlagCount: number;
  doctorAppointments: number;
  caregiverSuggestionZh: string;
  sensitiveDetails: string[];
};

export function buildFamilyWeeklyReport({
  checkins,
  alerts,
  appointments,
  weekStart,
  canShareSensitiveDetails = false,
}: {
  checkins: CheckInStatusRecord[];
  alerts: CheckInAlertRecord[];
  appointments: FamilyWeeklyAppointment[];
  weekStart: Date;
  canShareSensitiveDetails?: boolean;
}): FamilyWeeklyReport {
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const checkInDays = new Set(
    checkins
      .map((item) => item.created_at.slice(0, 10))
      .filter((date) => weekDays.includes(date)),
  );
  const notFeelingWellDays = new Set(
    [
      ...alerts
        .filter((item) => item.alert_type === "not_feeling_well")
        .map((item) => item.created_at.slice(0, 10)),
      ...checkins
        .filter((item) => item.metadata?.notFeelingWell === true)
        .map((item) => item.created_at.slice(0, 10)),
    ],
  );
  const redFlagCount =
    alerts.filter((item) => item.alert_type === "emergency_prompt").length +
    checkins.filter((item) => item.metadata?.redFlag === true).length;

  return {
    checkInDays: checkInDays.size,
    missedCheckInDays: Math.max(0, 7 - checkInDays.size),
    notFeelingWellDays: notFeelingWellDays.size,
    redFlagCount,
    doctorAppointments: appointments.length,
    caregiverSuggestionZh: buildCaregiverSuggestion(checkInDays.size, notFeelingWellDays.size, redFlagCount),
    sensitiveDetails: canShareSensitiveDetails ? [] : [],
  };
}

export function buildFamilyWeeklyPreview(report: Pick<FamilyWeeklyReport, "checkInDays">) {
  return `今週有 ${report.checkInDays} 日 check-in。升級 Family Care 可查看完整家庭報告。`;
}

export function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + diff);

  return start;
}

function buildCaregiverSuggestion(checkInDays: number, notFeelingWellDays: number, redFlagCount: number) {
  if (redFlagCount > 0) {
    return "今週有紅旗提示，請先確認是否已按 999 或醫護建議處理。";
  }

  if (notFeelingWellDays > 0) {
    return "今週曾經話唔舒服，可以打個電話關心一下。";
  }

  if (checkInDays < 4) {
    return "今週 check-in 較少，可以用家庭分享提醒每日一撳。";
  }

  return "今週有穩定 check-in，覆診前可以整理簡短摘要。";
}
