"use client";

import { AlertTriangle, ArrowUp, LoaderCircle, Mic, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AIOrb3D, type AIOrb3DState } from "@/components/ai-orb-3d";
import type { NavigationGuideResponse } from "@/lib/ai/types";
import { analyzeIntake, type IntakeMode, type Recommendation } from "@/lib/navigation-engine";
import styles from "./navigation-workspace.module.css";

type AssistantStatus = "Ready" | "Listening" | "Thinking" | "Explaining" | "Emergency";

const insuranceTerms = [
  "insurance",
  "coverage",
  "claim",
  "claims",
  "underwriting",
  "policy",
  "premium",
  "保險",
  "保障",
  "索償",
  "理賠",
  "保單",
  "核保",
  "保費",
  "自願醫保",
  "危疾",
  "住院醫療",
];

const policyTerms = ["claim", "claims", "policy", "索償", "理賠", "保單", "拒賠", "條款"];

export function NavigationWorkspace() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedInput = input.trim();
  const inferredMode = useMemo(() => inferMode(trimmedInput), [trimmedInput]);
  const isEmergency = result?.urgency.level === 1;
  const assistantStatus = getAssistantStatus({
    hasInput: trimmedInput.length > 0,
    isMicActive,
    isSubmitting,
    isEmergency,
    hasResult: Boolean(result),
  });
  const assistantState = mapAssistantState(assistantStatus);
  const visualMode: "medical" | "insurance" =
    isEmergency ? "medical" : inferredMode === "insurance" || inferredMode === "policy" ? "insurance" : "medical";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = inputRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [input]);

  function handleInputChange(nextInput: string) {
    setInput(nextInput);
    setErrorMessage(null);
    setResult(null);
  }

  async function handleSubmit() {
    const currentInput = input.trim();

    if (!currentInput || isSubmitting) {
      inputRef.current?.focus();
      return;
    }

    const mode = inferMode(currentInput);
    const deterministicResult = analyzeIntake(mode, currentInput);

    setErrorMessage(null);
    setIsSubmitting(true);
    setResult(null);

    if (deterministicResult.urgency.level === 1) {
      setResult(deterministicResult);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/navigation/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: currentInput,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Guide request failed with ${response.status}`);
      }

      const payload = (await response.json()) as NavigationGuideResponse;
      setResult(payload.recommendation);
    } catch {
      setResult(deterministicResult);
      setErrorMessage("AI connection unavailable. Showing safe rule-based guidance.");
    } finally {
      setIsSubmitting(false);
      setIsMicActive(false);
    }
  }

  return (
    <main className={styles.shell}>
      <h1 className={styles.srOnly}>Hong Kong AI Healthcare and Insurance Navigation</h1>

      <section className={styles.experience} aria-label="AI healthcare navigation workspace">
        <div className={styles.assistantStage} aria-label="3D AI healthcare guide">
          <AIOrb3D state={assistantState} mode={visualMode} />
        </div>

        <form
          className={`${styles.inputDock} ${visualMode === "insurance" ? styles.insuranceDock : ""} ${
            isEmergency ? styles.emergencyDock : ""
          }`}
          aria-label="Ask the AI healthcare guide"
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
            aria-label="Tell the AI healthcare guide what is going on"
            placeholder="Tell me what is going on..."
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
          />

          <button
            className={`${styles.iconButton} ${isMicActive ? styles.micActive : ""}`}
            type="button"
            aria-label={isMicActive ? "Stop microphone input" : "Start microphone input"}
            aria-pressed={isMicActive}
            onClick={() => {
              setIsMicActive((current) => !current);
              setErrorMessage(null);
            }}
          >
            <Mic size={20} aria-hidden="true" />
          </button>

          <button
            className={styles.sendButton}
            type="submit"
            aria-label="Send message"
            disabled={!trimmedInput || isSubmitting}
          >
            {isSubmitting ? (
              <LoaderCircle className={styles.spinnerIcon} size={20} aria-hidden="true" />
            ) : (
              <ArrowUp size={20} aria-hidden="true" />
            )}
          </button>
        </form>

        {(result || isSubmitting) && (
          <AnswerPanel
            result={result}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        )}
      </section>
    </main>
  );
}

function AnswerPanel({
  result,
  isSubmitting,
  errorMessage,
}: {
  result: Recommendation | null;
  isSubmitting: boolean;
  errorMessage: string | null;
}) {
  if (isSubmitting) {
    return (
      <section className={styles.answerPanel} aria-live="polite">
        <div className={styles.thinkingLine}>
          <LoaderCircle size={16} aria-hidden="true" />
          <span>Checking urgent warning signs first...</span>
        </div>
      </section>
    );
  }

  if (!result) {
    return null;
  }

  const isEmergency = result.urgency.level === 1;
  const isInsurance = result.mode === "insurance" || result.mode === "policy";
  const summary = getConciseSummary(result);

  return (
    <section
      className={`${styles.answerPanel} ${isEmergency ? styles.answerEmergency : ""} ${
        isInsurance ? styles.answerInsurance : ""
      }`}
      aria-live={isEmergency ? "assertive" : "polite"}
    >
      <div className={styles.answerHeader}>
        <span className={styles.urgencyLabel}>{result.urgency.label}</span>
        {isInsurance && !isEmergency ? (
          <span className={styles.coverageLabel}>
            <ShieldCheck size={14} aria-hidden="true" />
            Coverage categories only
          </span>
        ) : null}
      </div>

      <p className={styles.answerText}>{summary}</p>
      <p className={styles.nextStep}>
        <strong>Next step:</strong> {result.nextAction}
      </p>

      {isInsurance && !isEmergency ? (
        <p className={styles.categoryLine}>
          {result.insuranceCategories.slice(0, 3).join(" · ")}
        </p>
      ) : null}

      {isEmergency ? (
        <a className={styles.emergencyCta} href="tel:999" aria-label="Call 999 or go to Accident and Emergency now">
          <AlertTriangle size={18} aria-hidden="true" />
          Call 999 / Go to A&amp;E now
        </a>
      ) : null}

      {errorMessage ? <p className={styles.errorNote}>{errorMessage}</p> : null}
    </section>
  );
}

function inferMode(input: string): IntakeMode {
  const normalized = input.toLowerCase();

  if (!normalized) {
    return "medical";
  }

  if (policyTerms.some((term) => normalized.includes(term.toLowerCase()))) {
    return "policy";
  }

  if (insuranceTerms.some((term) => normalized.includes(term.toLowerCase()))) {
    return "insurance";
  }

  return "medical";
}

function getAssistantStatus({
  hasInput,
  isMicActive,
  isSubmitting,
  isEmergency,
  hasResult,
}: {
  hasInput: boolean;
  isMicActive: boolean;
  isSubmitting: boolean;
  isEmergency: boolean;
  hasResult: boolean;
}): AssistantStatus {
  if (isEmergency) {
    return "Emergency";
  }

  if (isSubmitting) {
    return "Thinking";
  }

  if (hasResult) {
    return "Explaining";
  }

  if (hasInput || isMicActive) {
    return "Listening";
  }

  return "Ready";
}

function mapAssistantState(status: AssistantStatus): AIOrb3DState {
  switch (status) {
    case "Listening":
      return "listening";
    case "Thinking":
      return "thinking";
    case "Explaining":
      return "speaking";
    case "Emergency":
      return "emergency";
    case "Ready":
    default:
      return "idle";
  }
}

function getConciseSummary(result: Recommendation) {
  const text = result.assistantMessage || result.urgency.summary;
  const firstParagraph = text.split(/\n{2,}/)[0]?.trim() || result.urgency.summary;

  if (firstParagraph.length <= 320) {
    return firstParagraph;
  }

  return `${firstParagraph.slice(0, 317).trim()}...`;
}
