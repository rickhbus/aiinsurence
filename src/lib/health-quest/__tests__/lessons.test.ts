import { describe, expect, it } from "vitest";
import { findLesson, lessonTracks } from "../lesson-content";
import { buildLessonXpEvent, getLessonBySlug } from "../lessons";

describe("health quest lessons", () => {
  it("has at least one lesson per required track", () => {
    expect(lessonTracks).toHaveLength(10);
    expect(lessonTracks.every((track) => track.lessons.length >= 1)).toBe(true);
  });

  it("includes the hydration example lesson", () => {
    const lesson = findLesson("hydration-basics", "start-with-one-glass");

    expect(lesson?.title.en).toBe("Start with one glass");
    expect(lesson?.quiz.correctAnswerId).toBe("b");
  });

  it("builds a single lesson XP event shape", () => {
    const found = getLessonBySlug("hydration-basics", "start-with-one-glass");

    expect(found).toBeTruthy();
    expect(buildLessonXpEvent(found!.lesson, "2026-05-14T00:00:00.000Z")).toMatchObject({
      amount: 5,
      reason: "lesson_completed:start-with-one-glass",
    });
  });
});
