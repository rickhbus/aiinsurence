import {
  deleteHealthMemory,
  getHealthMemory,
  updateHealthMemory,
} from "@/lib/health-data/memory";
import type { HealthMemoryCategory } from "@/lib/health-data/types";
import {
  healthMemoryDeleteSchema,
  healthMemoryUpdateSchema,
} from "@/lib/health-data/validation";
import {
  getAuthenticatedSupabase,
  readValidatedJson,
} from "@/lib/server/persistence-auth";

export async function GET(request: Request) {
  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const validCategories = new Set([
    "profile",
    "fitness",
    "nutrition",
    "healthcare",
    "insurance",
    "behavior",
  ]);

  try {
    const memory = await getHealthMemory(auth.supabase, auth.user.id, {
      category: validCategories.has(category ?? "")
        ? (category as HealthMemoryCategory)
        : undefined,
      limit: 100,
    });

    return Response.json({ memory });
  } catch {
    return Response.json(
      { error: "Health memory is temporarily unavailable." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const parsed = await readValidatedJson(request, healthMemoryUpdateSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id, ...input } = parsed.data;
    const memory = await updateHealthMemory(
      auth.supabase,
      auth.user.id,
      id,
      input,
    );

    return Response.json({ memory });
  } catch {
    return Response.json({ error: "儲存失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const parsed = await readValidatedJson(request, healthMemoryDeleteSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    await deleteHealthMemory(auth.supabase, auth.user.id, parsed.data.id);

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "刪除失敗，請檢查網絡後再試。" }, { status: 500 });
  }
}
