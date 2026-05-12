"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";

type BaseSubmitOptions = {
  endpoint: string;
  successZh: string;
  successEn?: string;
  locale?: "zh-Hant" | "en";
};

type SubmitOptions = BaseSubmitOptions & (
  | { payload: Record<string, unknown>; formData?: never }
  | { formData: FormData; payload?: never }
);

export function useHealthOsSubmit() {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  async function submit(options: SubmitOptions) {
    if (savingRef.current) {
      return null;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const isFormData = "formData" in options;
      const headers = await getSupabaseRequestHeaders({
        Accept: "application/json",
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      });

      const response = await fetch(options.endpoint, {
        method: "POST",
        headers,
        body: isFormData
          ? options.formData
          : JSON.stringify(stripEmpty(options.payload)),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const error = typeof body?.error === "string"
          ? body.error
          : options.locale === "en"
            ? "Could not save yet; local input is kept."
            : "暫時未能保存，已保留本機輸入。";
        toast.error(error);
        return body;
      }

      toast.success(options.locale === "en" ? options.successEn ?? options.successZh : options.successZh);
      window.dispatchEvent(new Event("health-log-saved"));
      return body;
    } catch {
      toast.error(options.locale === "en" ? "Connection failed." : "暫時未能連線。");
      return null;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return { saving, submit };
}

function stripEmpty(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== null && value !== undefined),
  );
}
