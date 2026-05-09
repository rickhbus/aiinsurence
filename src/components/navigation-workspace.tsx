"use client";

import Image from "next/image";
import { AlertTriangle, ArrowUp, Mic } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { NavigationGuideResponse } from "@/lib/ai/types";
import {
  analyzeIntake,
  type IntakeMode,
  type Recommendation,
} from "@/lib/navigation-engine";
import styles from "./human-ai-home.module.css";

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

  const visualState = getVisualState({
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
      <section
        className={`${styles.home} ${styles[visualState]} ${
          inferredMode === "insurance" ? styles.insuranceMode : ""
        }`}
        aria-label="AI healthcare guide"
      >
        <header className={styles.topbar}>
          <a className={styles.brand} href="#home" aria-label="AI Healthcare Guide">
            <span className={styles.brandMark}>✚</span>
            <span>
              <strong>智健導航</strong>
              <small>AI Healthcare Guide</small>
            </span>
          </a>

          <div className={styles.topActions}>
            <button type="button">公立 / 私家</button>
            <button type="button">繁中 / English</button>
          </div>
        </header>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>AI Healthcare Guide</span>
            <h1>
              你好，我係你的
              <span>AI 醫療顧問</span>
            </h1>
            <p>Describe your symptom, care question, or insurance concern.</p>
          </div>

          <div className={styles.avatarStage}>
            <div className={styles.statusPill}>
              <span />
              {getStatusLabel(visualState)}
            </div>

            <Image
              className={styles.avatarImage}
              src="/ai-healthcare-guide.png"
              alt="AI healthcare navigation guide, not a real doctor"
              width={900}
              height={1100}
              priority
            />

            <div className={styles.avatarBadge}>
              <strong>智健導航</strong>
              <small>AI Healthcare Guide</small>
            </div>
          </div>
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
            placeholder="請描述症狀或保險問題..."
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

        <p className={styles.safetyNote}>
          AI healthcare navigation only. Not a diagnosis.
        </p>
      </section>
    </main>
  );
}

type VisualState =
  | "ready"
  | "listening"
  | "thinking"
  | "explaining"
  | "emergency";

function getVisualState({
  input,
  isRecording,
  isSubmitting,
  result,
}: {
  input: string;
  isRecording: boolean;
  isSubmitting: boolean;
  result: Recommendation | null;
}): VisualState {
  if (result?.urgency.level === 1) {
    return "emergency";
  }

  if (isSubmitting) {
    return "thinking";
  }

  if (result) {
    return "explaining";
  }

  if (isRecording || input.trim().length > 0) {
    return "listening";
  }

  return "ready";
}

function getStatusLabel(state: VisualState) {
  switch (state) {
    case "listening":
      return "Listening";
    case "thinking":
      return "Thinking";
    case "explaining":
      return "Explaining";
    case "emergency":
      return "Emergency";
    case "ready":
    default:
      return "Ready";
  }
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