import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

export async function getAuthenticatedSupabase(): Promise<AuthenticatedSupabase> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      response: Response.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      response: Response.json(
        { error: "Authentication is required to save this data." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, supabase, user: data.user };
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
  const body = await readJsonBody<unknown>(request);

  if (!body) {
    return {
      ok: false,
      response: Response.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "請輸入有效數值。",
          issues: parsed.error.issues.map((issue) => issue.message).slice(0, 3),
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
