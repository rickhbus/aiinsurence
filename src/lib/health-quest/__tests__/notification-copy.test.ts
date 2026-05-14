import { describe, expect, it } from "vitest";
import { assertNotificationCopySafe, notificationCopy } from "../notification-copy";

describe("notification copy", () => {
  it("contains no private health detail", () => {
    expect(Object.values(notificationCopy).every(assertNotificationCopySafe)).toBe(true);
    expect(JSON.stringify(notificationCopy)).not.toMatch(/mood is low|symptoms are serious|insurance score/i);
  });
});
