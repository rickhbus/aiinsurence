import {
  assertUserId,
  throwIfSupabaseError,
  type HealthDataClient,
} from "./common";
import {
  INSURANCE_DISCLAIMER_ZH,
  type InsuranceHelperResponse,
} from "./types";
import { insuranceHelperInputSchema } from "./validation";

export function buildInsuranceHelper(input: unknown): InsuranceHelperResponse {
  const payload = insuranceHelperInputSchema.parse(input);
  const lower = `${payload.topic} ${payload.text}`.toLowerCase();
  const isClaim = /claim|索償|賠償|收據|醫生紙|invoice|receipt/u.test(lower);
  const isExclusion = /exclusion|不保|等候期|waiting|pre-existing|既有/u.test(lower);

  return {
    summary: isClaim
      ? "這看起來與索償準備有關，重點是先整理文件和向保險公司確認程序。"
      : isExclusion
        ? "這可能涉及不保事項、等候期或既有病況條款，需要逐字核對保單。"
        : "這屬一般保障理解問題，可以先分清保障類型、限額、等候期、網絡和不保事項。",
    possibleMeaning: isClaim
      ? "保險公司通常會要求醫療收據、診斷或病假證明、索償表格及身份/保單資料。"
      : isExclusion
        ? "條款可能表示某些情況不會獲賠，或需要過了指定等候期才生效。"
        : "內容可能是在描述保障範圍、賠償限額或使用醫療服務前需要留意的條件。",
    questionsToAskInsurer: [
      "這項保障是否適用於我的情況？需要預先批核嗎？",
      "有沒有等候期、不保事項、網絡限制或每年/每次限額？",
      "索償需要哪些文件？是否需要正本收據或醫生轉介信？",
    ],
    documentsToPrepare: [
      "保單號碼和受保人資料",
      "醫療收據、診斷證明、轉介信或出院摘要（如適用）",
      "已填妥索償表格和付款紀錄",
    ],
    disclaimer: INSURANCE_DISCLAIMER_ZH,
  };
}

export async function saveInsuranceNote(
  supabase: HealthDataClient,
  userId: string,
  input: unknown,
  response: InsuranceHelperResponse,
) {
  assertUserId(userId);
  const payload = insuranceHelperInputSchema.parse(input);

  const { data, error } = await supabase
    .from("insurance_notes")
    .insert({
      user_id: userId,
      insurance_type: payload.insurance_type,
      topic: payload.topic,
      notes: payload.text.slice(0, 500),
      claim_documents: response.documentsToPrepare,
      questions_to_ask: response.questionsToAskInsurer,
      disclaimer: response.disclaimer,
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "save insurance note");

  return data;
}
