import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { z } from "zod";
import { createBearerClient, createClient } from "@/lib/supabase/server";
import { getRequestId, jsonWithRequestId } from "./request-context";

export type AuthenticatedSupabase =
  | {
      ok: true;
      supabase: SupabaseClient;
      user: User;
    }
  | {
      ok: false;
      response: Response;
    };

export async function getAuthenticatedSupabase(request?: Request): Promise<AuthenticatedSupabase> {
  const requestId = request ? getRequestId(request) : crypto.randomUUID();
  const bearerToken = readBearerToken(request);

  if (bearerToken) {
    const supabase = createBearerClient(bearerToken);

    if (!supabase) {
      return {
        ok: false,
        response: jsonWithRequestId(
          { error: "Supabase is not configured." },
          { status: 503 },
          requestId,
        ),
      };
    }

    const { data, error } = await supabase.auth.getUser(bearerToken);

    if (error || !data.user) {
      return {
        ok: false,
        response: jsonWithRequestId(
          { error: "Authentication is required to save this data." },
          { status: 401 },
          requestId,
        ),
      };
    }

    return { ok: true, supabase, user: data.user };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      response: jsonWithRequestId(
        { error: "Supabase is not configured." },
        { status: 503 },
        requestId,
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      response: jsonWithRequestId(
        { error: "Authentication is required to save this data." },
        { status: 401 },
        requestId,
      ),
    };
  }

  return { ok: true, supabase, user: data.user };
}

function readBearerToken(request?: Request) {
  const authorization = request?.headers.get("authorization")?.trim();

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice("bearer ".length).trim() || null;
}

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function readValidatedJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: Response }
> {
  const requestId = getRequestId(request);
  const body = await readJsonBody<unknown>(request);

  if (!body) {
    return {
      ok: false,
      response: jsonWithRequestId({ error: "Invalid JSON body." }, { status: 400 }, requestId),
    };
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      response: jsonWithRequestId(
        {
          error: "請輸入有效數值。",
          issues: parsed.error.issues.map((issue) => issue.message).slice(0, 3),
        },
        { status: 400 },
        requestId,
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
