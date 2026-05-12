import type { NextRequest } from "next/server";
import { enforceProductionApiRateLimit } from "@/lib/server/production-api-rate-limit";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const rateLimitResponse = await enforceProductionApiRateLimit(request);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
