import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("human AI assistant home layout", () => {
  it("keeps the mobile avatar, greeting, input, and disclaimer controlled", () => {
    const homeCss = readFileSync(
      new URL("./human-ai-home.module.css", import.meta.url),
      "utf8",
    );
    const doctorCss = readFileSync(
      new URL("./human-doctor-3d.module.css", import.meta.url),
      "utf8",
    );
    const component = readFileSync(
      new URL("./navigation-workspace.tsx", import.meta.url),
      "utf8",
    );
    const doctorComponent = readFileSync(
      new URL("./human-doctor-3d.tsx", import.meta.url),
      "utf8",
    );

    expect(homeCss).toMatch(/\.heroCopy h1\s*\{[\s\S]*font-size:\s*clamp\(2rem,\s*8vw,\s*4\.5rem\)/);
    expect(homeCss).toContain(".titleIntro");
    expect(homeCss).toMatch(/\.safetyNote\s*\{[\s\S]*opacity:\s*0\.75/);
    expect(homeCss).toMatch(/@media \(max-width:\s*560px\)\s*\{[\s\S]*\.avatarHero\s*\{[\s\S]*width:\s*min\(78vw,\s*380px\)/);
    expect(homeCss).toMatch(/@media \(max-width:\s*560px\)\s*\{[\s\S]*\.inputDock\s*\{[\s\S]*position:\s*sticky/);
    expect(doctorCss).toMatch(/@media \(max-width:\s*520px\)\s*\{[\s\S]*\.stage\s*\{[\s\S]*width:\s*min\(78vw,\s*380px\)/);
    expect(component).toContain('aria-label="AI healthcare guide"');
    expect(component).toContain("styles.titleIntro");
    expect(component).toContain('placeholder="請描述症狀、照護或保險問題..."');
    expect(component).toContain("analyzeIntake(mode, trimmedInput)");
    expect(component).toContain("deterministicResult.urgency.level === 1");
    expect(doctorComponent).toContain('const MODEL_PATH = "/models/ai-doctor-guide.glb"');
    expect(doctorComponent).toContain("const TARGET_MODEL_HEIGHT = 2.86");
    expect(doctorComponent).toContain("const CAMERA_LOOK_AT");
  });
});
