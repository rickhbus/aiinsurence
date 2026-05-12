import { analyzePhotoJournalImage, photoJournalSaveSchema, sanitizePhotoJournalText } from "@/lib/photo-journal";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const maxImageBytes = 6 * 1024 * 1024;
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  if (request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data")) {
    const auth = await getAuthenticatedSupabase(request);

    if (!auth.ok) {
      return auth.response;
    }

    const formData = await request.formData().catch(() => null);
    const image = formData?.get("image");

    if (!(image instanceof File)) {
      return jsonWithRequestId({ error: "請上載有效圖片。" }, { status: 400 }, requestId);
    }

    if (!supportedImageTypes.has(image.type)) {
      return jsonWithRequestId({ error: "只支援 JPG、PNG、WebP 或 HEIC 圖片。" }, { status: 400 }, requestId);
    }

    if (image.size > maxImageBytes) {
      return jsonWithRequestId({ error: "圖片不可超過 6MB。" }, { status: 400 }, requestId);
    }

    const analysis = await analyzePhotoJournalImage({
      imageBytes: new Uint8Array(await image.arrayBuffer()),
      mediaType: image.type,
    });

    return jsonWithRequestId({ analysis, saved: false }, undefined, requestId);
  }

  const parsed = await readValidatedJson(request, photoJournalSaveSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const auth = await getAuthenticatedSupabase(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("photo_journal_entries")
    .insert({
      user_id: auth.user.id,
      category: parsed.data.category,
      observation_zh: sanitizePhotoJournalText(parsed.data.observationZh),
      user_note_zh: parsed.data.userNoteZh ? sanitizePhotoJournalText(parsed.data.userNoteZh) : null,
      confirmed_by_user: true,
    })
    .select("id,category,observation_zh,created_at")
    .single();

  if (error) {
    return jsonWithRequestId({ error: "暫時未能保存相片記錄。" }, { status: 500 }, requestId);
  }

  return jsonWithRequestId({ saved: true, entry: data }, undefined, requestId);
}
