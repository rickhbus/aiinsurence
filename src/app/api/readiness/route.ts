import { logInfo, logWarn } from "@/lib/observability/logger";
import { buildReadinessReport } from "@/lib/server/readiness";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const report = await buildReadinessReport({ requestId });
  const statusCode = report.status === "not_ready" ? 503 : 200;
  const log = report.status === "ready" ? logInfo : logWarn;

  log("readiness_check", {
    route: "/api/readiness",
    requestId,
    status: report.status,
    checks: report.checks.length,
  });

  return jsonWithRequestId(report, { status: statusCode }, requestId);
}
