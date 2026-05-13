"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BigButton } from "@/components/simple-mode/big-button";
import type { SimpleSuggestionState } from "@/components/simple-mode/simple-suggestion";
import { getSupabaseRequestHeaders } from "@/lib/supabase/client";
import type { PhotoJournalAnalysis } from "@/lib/photo-journal";

export function PhotoJournalButton({
  disabled,
  label = "影相",
  onResult,
}: {
  disabled?: boolean;
  label?: string;
  onResult: (result: SimpleSuggestionState) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<PhotoJournalAnalysis | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);

  async function analyze(file: File | null | undefined) {
    if (!file) {
      return;
    }

    setBusy(true);

    try {
      const formData = new FormData();
      formData.set("image", file);
      const headers = await getSupabaseRequestHeaders({ Accept: "application/json" });
      const response = await fetch("/api/photo-journal", {
        method: "POST",
        headers,
        body: formData,
      });
      const body = await response.json().catch(() => null);

      if (response.ok && body?.analysis) {
        setAnalysis(body.analysis);
        setNote(body.analysis.observationZh);
        onResult({
          confirmation: "請你確認",
          suggestion: body.analysis.observationZh,
        });
        return;
      }

      onResult({
        confirmation: "暫時分析唔到",
        suggestion: "你可以稍後再試，或者用文字記錄。",
        tone: "warning",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function save() {
    if (!analysis) {
      return;
    }

    setBusy(true);

    try {
      const headers = await getSupabaseRequestHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      const response = await fetch("/api/photo-journal", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "save",
          category: analysis.category,
          observationZh: note || analysis.observationZh,
          userNoteZh: note || null,
        }),
      });

      if (response.ok) {
        setAnalysis(null);
        setEditing(false);
        onResult({
          confirmation: "保存咗",
          suggestion: "相片記錄已保存。緊急情況請即刻打 999。",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <BigButton
        emoji="📷"
        tone="soft"
        disabled={disabled || busy}
        aria-label={`${label} / Send pics`}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "處理中" : label}
      </BigButton>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => void analyze(event.target.files?.[0])}
      />
      {analysis ? (
        <div className="rounded-xl border border-border/70 bg-card/95 p-4">
          <p className="text-xl font-bold">{analysis.observationZh}</p>
          {analysis.safetyNoticeZh ? <p className="mt-2 text-base leading-7">{analysis.safetyNoticeZh}</p> : null}
          {editing ? (
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-3"
              aria-label="Edit photo journal note"
            />
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button disabled={busy} onClick={save}>保存</Button>
            <Button variant="outline" disabled={busy} onClick={() => setEditing(true)}>改一改</Button>
            <Button variant="outline" disabled={busy} onClick={() => setAnalysis(null)}>唔保存</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
