import {
  lifeTrackerLogInputSchema,
  saveLifeTrackerLog,
} from "@/lib/health-data/life-tracker";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const parsed = await readValidatedJson(request, lifeTrackerLogInputSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const result = await saveLifeTrackerLog({
      supabase: auth.supabase,
      userId: auth.user.id,
      input: parsed.data,
    });

    return jsonWithRequestId(result, undefined, requestId);
  } catch {
    return jsonWithRequestId(
      { error: "暫時未能保存生活紀錄，請稍後再試。" },
      { status: 500 },
      requestId,
    );
  }
}
