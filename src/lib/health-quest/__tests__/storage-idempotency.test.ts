import { describe, expect, it } from "vitest";
import { insertXPEvent } from "../storage";

describe("Health Quest storage idempotency", () => {
  it("returns the existing XP event when a duplicate retry hits event_key uniqueness", async () => {
    const supabase = {
      from(table: string) {
        if (table !== "user_xp_events") {
          throw new Error(`Unexpected table ${table}`);
        }

        return {
          insert() {
            return {
              select() {
                return {
                  async single() {
                    return {
                      data: null,
                      error: {
                        code: "23505",
                        message: "duplicate key value violates unique constraint",
                      },
                    };
                  },
                };
              },
            };
          },
          select() {
            const query = {
              eq() {
                return query;
              },
              async maybeSingle() {
                return {
                  data: {
                    id: "existing-xp",
                    quest_id: null,
                    amount: 10,
                    reason: "weekly_review_completed:2026-05-11",
                    event_key: "weekly_review:2026-w20",
                    created_at: "2026-05-14T00:00:00.000Z",
                  },
                  error: null,
                };
              },
            };

            return query;
          },
        };
      },
    };

    const event = await insertXPEvent(supabase as never, "user-1", {
      id: "weekly-2026-05-11",
      amount: 10,
      reason: "weekly_review_completed:2026-05-11",
      createdAt: "2026-05-14T00:00:00.000Z",
      eventKey: "weekly_review:2026-w20",
    });

    expect(event).toMatchObject({
      id: "existing-xp",
      eventKey: "weekly_review:2026-w20",
      amount: 10,
    });
  });
});
