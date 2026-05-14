import { describe, expect, it } from "vitest";
import { findLesson, lessonTracks } from "../lesson-content";
import { buildLessonXpEvent, getLessonBySlug } from "../lessons";

describe("health quest lessons", () => {
  it("has at least one lesson per required track", () => {
    expect(lessonTracks).toHaveLength(9);
    expect(lessonTracks.every((track) => track.lessons.length >= 8)).toBe(true);
  });

  it("includes the Start Strong unit and multi-question lesson cards", () => {
    const lesson = findLesson("start-strong", "first-tiny-step");

    expect(lesson?.title.en).toBe("First tiny step");
    expect(lesson?.quiz.correctAnswerId).toBe("b");
    expect(lesson?.questions.length).toBeGreaterThanOrEqual(2);
  });

  it("builds a single lesson XP event shape", () => {
    const found = getLessonBySlug("start-strong", "first-tiny-step");

    expect(found).toBeTruthy();
    expect(buildLessonXpEvent(found!.lesson, "2026-05-14T00:00:00.000Z")).toMatchObject({
      amount: 5,
      reason: "lesson_completed:first-tiny-step",
    });
  });
});
