import { analyzeMeal } from "@/lib/health-os/nutrition";
import { foodLogSchema } from "@/lib/health-os/validators";
import { analyzeFoodPhoto } from "@/lib/food/photo-analysis";
import { getAuthenticatedSupabase, readValidatedJson } from "@/lib/server/persistence-auth";
import { getRequestId, jsonWithRequestId } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

const maxImageBytes = 6 * 1024 * 1024;
const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  if (request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data")) {
    const auth = await getAuthenticatedSupabase(request);

    if (!auth.ok) {
      return auth.response;
    }

    const formData = await request.formData().catch(() => null);

    if (!formData) {
      return jsonWithRequestId({ error: "請上載有效圖片。" }, { status: 400 }, requestId);
    }

    const image = formData.get("image");

    if (!(image instanceof File)) {
      return jsonWithRequestId({ error: "請上載有效圖片。" }, { status: 400 }, requestId);
    }

    if (!supportedImageTypes.has(image.type)) {
      return jsonWithRequestId({ error: "只支援 JPG、PNG、WebP 或 HEIC 圖片。" }, { status: 400 }, requestId);
    }

    if (image.size > maxImageBytes) {
      return jsonWithRequestId({ error: "圖片不可超過 6MB。" }, { status: 400 }, requestId);
    }

    const analysis = await analyzeFoodPhoto({
      imageBytes: new Uint8Array(await image.arrayBuffer()),
      mediaType: image.type,
      mealType: textFormValue(formData.get("mealType")),
      description: textFormValue(formData.get("description")),
    });

    return jsonWithRequestId({
      analysis: analysis.analysis,
      providerStatus: analysis.status,
    }, undefined, requestId);
  }

  const parsed = await readValidatedJson(request, foodLogSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  return jsonWithRequestId({
    analysis: analyzeMeal({
      mealType: parsed.data.mealType,
      description: parsed.data.description,
      estimatedCalories: parsed.data.estimatedCalories,
      proteinG: parsed.data.proteinG,
      carbsG: parsed.data.carbsG,
      fatG: parsed.data.fatG,
      fiberG: parsed.data.fiberG,
      waterMl: parsed.data.waterMl,
      caffeineMg: parsed.data.caffeineMg,
      alcoholUnits: parsed.data.alcoholUnits,
      highSugarFlag: parsed.data.highSugarFlag,
      highSodiumFlag: parsed.data.highSodiumFlag,
      hasImage: Boolean(parsed.data.imagePath),
    }),
  }, undefined, requestId);
}

function textFormValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
