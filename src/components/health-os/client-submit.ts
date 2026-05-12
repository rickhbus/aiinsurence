"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SubmitOptions = {
  endpoint: string;
  payload: Record<string, unknown>;
  successZh: string;
  successEn?: string;
  locale?: "zh-Hant" | "en";
};

export function useHealthOsSubmit() {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [supabase] = useState(() => getSupabaseBrowserClient());

  async function submit({ endpoint, payload, successZh, successEn, locale = "zh-Hant" }: SubmitOptions) {
    if (savingRef.current) {
      return null;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      const token = supabase ? await getAccessToken(supabase) : null;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(stripEmpty(payload)),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const error = typeof body?.error === "string"
          ? body.error
          : locale === "zh-Hant"
            ? "暫時未能保存，已保留本機輸入。"
            : "Could not save yet; local input is kept.";
        toast.error(error);
        return body;
      }

      toast.success(locale === "zh-Hant" ? successZh : successEn ?? successZh);
      window.dispatchEvent(new Event("health-log-saved"));
      return body;
    } catch {
      toast.error(locale === "zh-Hant" ? "暫時未能連線。" : "Connection failed.");
      return null;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return { saving, submit };
}

async function getAccessToken(supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>) {
  try {
    const currentSession = await supabase.auth.getSession();
    const existingToken = currentSession.data.session?.access_token;

    if (existingToken) {
      return existingToken;
    }

    const anonymousSession = await supabase.auth.signInAnonymously();

    return anonymousSession.data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function stripEmpty(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== null && value !== undefined),
  );
}
