import { logInfo } from "@/lib/observability/logger";
import {
  getDeploymentMetadata,
  getRequestId,
  jsonWithRequestId,
} from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const payload = {
    status: "ok",
    timestamp: new Date().toISOString(),
    ...getDeploymentMetadata(),
  };

  logInfo("health_check", {
    route: "/api/health",
    requestId,
    status: "ok",
  });

  return jsonWithRequestId(payload, { status: 200 }, requestId);
}
