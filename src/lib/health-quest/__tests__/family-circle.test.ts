import { describe, expect, it } from "vitest";
import {
  canShareRawHealthDetails,
  createFamilyInviteToken,
  familyPermissionSchema,
  getFamilyInviteExpiry,
  hashFamilyInviteToken,
  isPendingInviteAcceptable,
  privacySafeFamilyActivity,
  stripUnsafeFamilyPayload,
} from "../family-circle";

describe("family circle privacy", () => {
  it("defaults to streak-only progress copy", () => {
    expect(privacySafeFamilyActivity({
      displayName: "Rick",
      questsCompleted: 3,
      streakProtected: true,
      sharingLevel: "streak_only",
    })).toBe("Rick protected streak today");
  });

  it("does not allow raw details by default", () => {
    const defaults = familyPermissionSchema.parse({
      circleId: "00000000-0000-4000-8000-000000000001",
    });

    expect(defaults.sharingLevel).toBe("streak_only");
    expect(canShareRawHealthDetails("streak_only")).toBe(false);
    expect(canShareRawHealthDetails("doctor_prep_summary")).toBe(true);
  });

  it("strips unsafe family payload fields", () => {
    const safe = stripUnsafeFamilyPayload({
      questsCompleted: 3,
      symptomText: "private",
      moodNote: "private",
      diagnosis: "private",
      rawHealthDetails: "private",
      claimText: "private",
    });

    expect(safe).toEqual({ questsCompleted: 3 });
  });

  it("stores only hashed invite tokens", () => {
    const token = createFamilyInviteToken();
    const hash = hashFamilyInviteToken(token);

    expect(token).not.toBe(hash);
    expect(hash).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("rejects expired or revoked invites", () => {
    const now = new Date("2026-05-14T00:00:00.000Z");

    expect(isPendingInviteAcceptable({
      status: "pending",
      expires_at: getFamilyInviteExpiry(now, 1),
      revoked_at: null,
      accepted_at: null,
    }, now)).toBe(true);
    expect(isPendingInviteAcceptable({
      status: "pending",
      expires_at: "2026-05-13T00:00:00.000Z",
      revoked_at: null,
      accepted_at: null,
    }, now)).toBe(false);
    expect(isPendingInviteAcceptable({
      status: "pending",
      expires_at: getFamilyInviteExpiry(now, 1),
      revoked_at: "2026-05-14T01:00:00.000Z",
      accepted_at: null,
    }, now)).toBe(false);
  });
});
