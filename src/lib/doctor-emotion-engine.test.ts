import { describe, expect, it } from "vitest";
import { deriveDoctorAffect } from "./doctor-emotion-engine";
import { analyzeIntake } from "./navigation-engine";

describe("doctor emotion engine", () => {
  it("starts warm and ready before the user engages", () => {
    expect(
      deriveDoctorAffect({
        input: "",
        isRecording: false,
        isSubmitting: false,
        mode: "medical",
        result: null,
        showGreeting: false,
      }),
    ).toMatchObject({
      state: "ready",
      emotion: "warm",
      cue: "idle",
    });
  });

  it("becomes gently concerned while risky symptoms are being typed", () => {
    expect(
      deriveDoctorAffect({
        input: "我胸口痛，又有少少氣促",
        isRecording: false,
        isSubmitting: false,
        mode: "medical",
        result: null,
        showGreeting: false,
      }),
    ).toMatchObject({
      state: "listening",
      emotion: "concerned",
      cue: "typing_risk",
    });
  });

  it("keeps the emergency emotion locked behind the confirmed triage result", () => {
    const result = analyzeIntake("medical", "我胸口痛，又有少少氣促");

    expect(
      deriveDoctorAffect({
        input: "我胸口痛，又有少少氣促",
        isRecording: false,
        isSubmitting: false,
        mode: "medical",
        result,
        showGreeting: false,
      }),
    ).toMatchObject({
      state: "emergency",
      emotion: "urgent",
      cue: "urgent",
      intensity: 1,
    });
  });

  it("uses concerned explaining for same-day care and reassuring for routine guidance", () => {
    const sameDay = analyzeIntake("medical", "高燒又持續嘔吐");
    const routine = analyzeIntake("medical", "皮膚痕咗兩個星期");

    expect(
      deriveDoctorAffect({
        input: "",
        isRecording: false,
        isSubmitting: false,
        mode: "medical",
        result: sameDay,
        showGreeting: false,
      }),
    ).toMatchObject({
      state: "explaining",
      emotion: "concerned",
      cue: "same_day",
    });

    expect(
      deriveDoctorAffect({
        input: "",
        isRecording: false,
        isSubmitting: false,
        mode: "medical",
        result: routine,
        showGreeting: false,
      }),
    ).toMatchObject({
      state: "explaining",
      emotion: "reassuring",
      cue: "care_route",
    });
  });
});
