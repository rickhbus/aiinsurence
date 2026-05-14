import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeDir = join(process.cwd(), "src/app/api/health-quest");
const routeFiles = [
  "onboarding/route.ts",
  "profile/route.ts",
  "today/route.ts",
  "complete/route.ts",
  "skip/route.ts",
  "recovery/route.ts",
  "progress/route.ts",
  "make-easier/route.ts",
  "why-this/route.ts",
  "weekly-review/route.ts",
  "learn/route.ts",
  "learn/complete/route.ts",
  "analytics/route.ts",
  "reminders/route.ts",
  "family-circle/route.ts",
  "family-circle/invite/route.ts",
  "family-circle/invite/accept/route.ts",
  "family-circle/permissions/route.ts",
  "family-challenges/route.ts",
  "doctor-mission/route.ts",
  "doctor-mission/export/route.ts",
  "insurance-mission/route.ts",
  "coach-style/route.ts",
  "streak-freeze/route.ts",
];

const mutationRoutes = routeFiles.filter((file) =>
  ![
    "today/route.ts",
    "progress/route.ts",
    "learn/route.ts",
    "doctor-mission/export/route.ts",
  ].includes(file),
);

describe("Health Quest API hardening", () => {
  it("keeps every route dynamic and free of raw logging/service-role imports", () => {
    for (const route of routeFiles) {
      const source = readFileSync(join(routeDir, route), "utf8");

      expect(source).toContain('export const dynamic = "force-dynamic"');
      expect(source).not.toMatch(/console\.(log|warn|error)|request\.json\(|createAdminClient|SUPABASE_SERVICE_ROLE/iu);
    }
  });

  it("validates every mutating JSON body through the shared Zod helper", () => {
    for (const route of mutationRoutes) {
      const source = readFileSync(join(routeDir, route), "utf8");

      if (source.includes("export async function POST")) {
        expect(source).toContain("readValidatedJson");
      }
    }
  });

  it("keeps health-content routes safety gated before normal persistence or XP", () => {
    const complete = readFileSync(join(routeDir, "complete/route.ts"), "utf8");
    const doctorMission = readFileSync(join(routeDir, "doctor-mission/route.ts"), "utf8");
    const doctorPostStart = doctorMission.indexOf("export async function POST");
    const doctorMissionWrite = doctorMission.indexOf('.from("doctor_prep_missions")', doctorPostStart);

    expect(complete.indexOf("const gate = runCompletionSafetyGate")).toBeLessThan(complete.indexOf("const now = new Date().toISOString()"));
    expect(complete.indexOf("const gate = runCompletionSafetyGate")).toBeLessThan(complete.indexOf("await insertXPEvent"));
    expect(doctorMission.indexOf("containsEmergencyRedFlag(combinedAnswers)")).toBeLessThan(doctorMissionWrite);
  });
});
