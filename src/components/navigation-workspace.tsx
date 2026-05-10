"use client";

import {
  HumanDoctor3D,
  type DoctorEmotion,
  type HumanDoctor3DState,
} from "@/components/human-doctor-3d";
import { AlertTriangle, ArrowUp, Mic, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NavigationGuideResponse } from "@/lib/ai/types";
import {
  analyzeIntake,
  type IntakeMode,
  type Recommendation,
} from "@/lib/navigation-engine";
import styles from "./human-ai-home.module.css";

const greetingLines = [
  "Hi, I'm your AI healthcare guide.",
  "Tell me what's going on.",
];

export function NavigationWorkspace() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);

  const inferredMode = useMemo(
    () => inferMode(input || result?.classification || ""),
    [input, result],
  );
  const isEmergency = result?.urgency.level === 1;
  const isSameDayCare = result?.urgency.level === 2;
  const isInsuranceMode = inferredMode === "insurance";
  const shouldShowGreeting =
    showGreeting &&
    !isEmergency &&
    !input.trim() &&
    !isSubmitting &&
    !isRecording &&
    !result;

  const doctorState = getDoctorState({
    input,
    isRecording,
    isSubmitting,
    result,
    showGreeting: shouldShowGreeting,
  });
  const doctorEmotion = getDoctorEmotion({
    input,
    isRecording,
    isSubmitting,
    result,
  });

  useEffect(() => {
    if (
      greetingDismissed ||
      input.trim() ||
      result ||
      isSubmitting ||
      isRecording
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowGreeting(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [greetingDismissed, input, isRecording, isSubmitting, result]);

  function handleInputChange(nextInput: string) {
    setInput(nextInput);
    setResult(null);
    setStatusMessage(null);

    if (nextInput.trim()) {
      setShowGreeting(false);
      setGreetingDismissed(true);
    }
  }

  function handleRecordingToggle() {
    setIsRecording((current) => !current);
    setShowGreeting(false);
    setGreetingDismissed(true);
  }

  function speakGreeting() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(greetingLines.join(" "));
    utterance.rate = 0.94;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function handleSubmit() {
    const trimmedInput = input.trim();

    if (!trimmedInput || isSubmitting) {
      inputRef.current?.focus();
      return;
    }

    const mode = inferMode(trimmedInput);
    const deterministicResult = analyzeIntake(mode, trimmedInput);

    setIsSubmitting(true);
    setStatusMessage(null);
    setShowGreeting(false);
    setGreetingDismissed(true);
    setResult(
      deterministicResult.urgency.level === 1 ? deterministicResult : null,
    );

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
      setResult(deterministicResult);
      setStatusMessage(
        "Showing safe rule-based guidance while AI is unavailable.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className={`${styles.shell} ${isEmergency ? styles.emergencyShell : ""}`}
    >
      <section
        id="home"
        className={`${styles.home} ${styles[`state_${doctorState}`]} ${
          isInsuranceMode ? styles.insuranceMode : ""
        }`}
        aria-label="AI healthcare guide"
      >
        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>
              你好，我係你的
              <span>AI 醫療導航</span>
            </h1>
            <p>
              Describe symptoms, care questions, or insurance concerns. I will
              check urgent signs first.
            </p>
          </div>

          <div className={styles.avatarPanel}>
            <HumanDoctor3D
              state={doctorState}
              emotion={doctorEmotion}
              className={styles.avatarHero}
            />

            {shouldShowGreeting ? (
              <button
                type="button"
                className={styles.greetingBubble}
                onClick={speakGreeting}
                aria-label="Speak greeting"
              >
                <Volume2 size={15} aria-hidden="true" />
                <span>
                  {greetingLines[0]}
                  <small>{greetingLines[1]}</small>
                </span>
              </button>
            ) : null}
          </div>
        </div>

        <form
          className={`${styles.inputDock} ${
            isEmergency ? styles.emergencyDock : ""
          } ${isInsuranceMode ? styles.insuranceDock : ""}`}
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
            placeholder="請描述症狀、照護或保險問題..."
            aria-label="Describe your symptom, care question, or insurance concern"
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                void handleSubmit();
              }
            }}
          />

          <button
            className={`${styles.iconButton} ${
              isRecording ? styles.recording : ""
            }`}
            type="button"
            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
            aria-pressed={isRecording}
            onClick={handleRecordingToggle}
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

        {input.trim() && !isSubmitting && !result ? (
          <p className={styles.preSubmitHint}>
            {"I'll check urgent signs first."}
          </p>
        ) : null}

        {(isSubmitting || result || statusMessage) && (
          <section
            className={`${styles.answer} ${
              isEmergency ? styles.answerEmergency : ""
            } ${isSameDayCare ? styles.answerConcerned : ""}`}
            aria-live={isEmergency ? "assertive" : "polite"}
          >
            {isEmergency && result ? (
              <>
                <div className={styles.answerHeader}>
                  <span>{result.urgency.label}</span>
                </div>
                <a className={styles.emergencyCta} href="tel:999">
                  <AlertTriangle size={17} aria-hidden="true" />
                  Call 999 / Go to A&amp;E now
                </a>
                <p className={styles.answerText}>
                  {result.assistantMessage || result.urgency.summary}
                </p>
                <p className={styles.nextStep}>{result.nextAction}</p>
              </>
            ) : isSubmitting ? (
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

function getDoctorState({
  input,
  isRecording,
  isSubmitting,
  result,
  showGreeting,
}: {
  input: string;
  isRecording: boolean;
  isSubmitting: boolean;
  result: Recommendation | null;
  showGreeting: boolean;
}): HumanDoctor3DState {
  if (result?.urgency.level === 1) {
    return "emergency";
  }

  if (isSubmitting) {
    return "thinking";
  }

  if (result || showGreeting) {
    return "explaining";
  }

  if (isRecording || input.trim().length > 0) {
    return "listening";
  }

  return "ready";
}

function getDoctorEmotion({
  input,
  isRecording,
  isSubmitting,
  result,
}: {
  input: string;
  isRecording: boolean;
  isSubmitting: boolean;
  result: Recommendation | null;
}): DoctorEmotion {
  if (result?.urgency.level === 1) {
    return "urgent";
  }

  if (isSubmitting) {
    return "focused";
  }

  if (result?.urgency.level === 2) {
    return "concerned";
  }

  if (result) {
    return "reassuring";
  }

  if (isRecording || input.trim().length > 0) {
    return "listening";
  }

  return "warm";
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
