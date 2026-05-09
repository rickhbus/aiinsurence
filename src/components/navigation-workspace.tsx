"use client";

import { AlertTriangle, ArrowUp, Mic } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AIOrb3D, type AIOrb3DState } from "@/components/ai-orb-3d";
import type { NavigationGuideResponse } from "@/lib/ai/types";
import {
  analyzeIntake,
  type IntakeMode,
  type Recommendation,
} from "@/lib/navigation-engine";
import styles from "./minimal-ai-home.module.css";

export function NavigationWorkspace() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const inferredMode = useMemo(
    () => inferMode(input || result?.classification || ""),
    [input, result],
  );

  const aiState = getAIState({
    input,
    isRecording,
    isSubmitting,
    result,
  });

  const isEmergency = result?.urgency.level === 1;

  function handleInputChange(nextInput: string) {
    setInput(nextInput);
    setResult(null);
    setStatusMessage(null);
  }

  async function handleSubmit() {
    const trimmedInput = input.trim();

    if (!trimmedInput || isSubmitting) {
      inputRef.current?.focus();
      return;
    }

    const mode = inferMode(trimmedInput);

    setIsSubmitting(true);
    setResult(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/navigation/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmedInput, mode }),
      });

      if (!response.ok) {
        throw new Error(`Guide request failed with ${response.status}`);
      }

      const payload = (await response.json()) as NavigationGuideResponse;
      setResult(payload.recommendation);
    } catch {
      setResult(analyzeIntake(mode, trimmedInput));
      setStatusMessage(
        "Showing safe rule-based guidance while AI is unavailable.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`${styles.shell} ${isEmergency ? styles.emergencyShell : ""}`}>
      <section className={styles.home} aria-label="Minimal AI healthcare assistant">
        <div className={styles.aiStage}>
          <AIOrb3D
            state={aiState}
            mode={inferredMode === "insurance" ? "insurance" : "medical"}
            className={styles.aiModel}
          />
        </div>

        <form
          className={styles.inputDock}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <textarea
            ref={inputRef}
            className={styles.textarea}
            value={input}
            rows={1}
            placeholder="Tell me what is going on..."
            aria-label="Describe your symptom, care question, or insurance concern"
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                void handleSubmit();
              }
            }}
          />

          <button
            className={`${styles.iconButton} ${isRecording ? styles.recording : ""}`}
            type="button"
            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
            aria-pressed={isRecording}
            onClick={() => setIsRecording((current) => !current)}
          >
            <Mic size={20} aria-hidden="true" />
          </button>

          <button
            className={styles.sendButton}
            type="submit"
            aria-label="Send"
            disabled={isSubmitting || input.trim().length === 0}
          >
            <ArrowUp size={21} aria-hidden="true" />
          </button>
        </form>

        {(isSubmitting || result || statusMessage) && (
          <section
            className={`${styles.answer} ${isEmergency ? styles.answerEmergency : ""}`}
            aria-live={isEmergency ? "assertive" : "polite"}
          >
            {isSubmitting ? (
              <p className={styles.answerText}>Checking urgent signs first...</p>
            ) : result ? (
              <>
                <div className={styles.answerHeader}>
                  <span>{result.urgency.label}</span>
                  {result.ai?.status ? <small>{result.ai.status}</small> : null}
                </div>

                <p className={styles.answerText}>
                  {result.assistantMessage || result.urgency.summary}
                </p>

                <p className={styles.nextStep}>{result.nextAction}</p>

                {isEmergency ? (
                  <a className={styles.emergencyCta} href="tel:999">
                    <AlertTriangle size={17} aria-hidden="true" />
                    Call 999 / Go to A&amp;E now
                  </a>
                ) : null}
              </>
            ) : null}

            {statusMessage ? (
              <p className={styles.statusMessage}>{statusMessage}</p>
            ) : null}
          </section>
        )}
      </section>
    </main>
  );
}

function inferMode(text: string): IntakeMode {
  const normalized = text.toLowerCase();

  const insuranceTerms = [
    "insurance",
    "policy",
    "claim",
    "coverage",
    "vhis",
    "保險",
    "保單",
    "索償",
    "保障",
    "住院",
    "危疾",
  ];

  return insuranceTerms.some((term) => normalized.includes(term))
    ? "insurance"
    : "medical";
}

function getAIState({
  input,
  isRecording,
  isSubmitting,
  result,
}: {
  input: string;
  isRecording: boolean;
  isSubmitting: boolean;
  result: Recommendation | null;
}): AIOrb3DState {
  if (result?.urgency.level === 1) {
    return "emergency";
  }

  if (isSubmitting) {
    return "thinking";
  }

  if (result) {
    return "speaking";
  }

  if (isRecording || input.trim().length > 0) {
    return "listening";
  }

  return "idle";
}