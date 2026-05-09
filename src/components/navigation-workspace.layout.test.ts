import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("minimal AI assistant home layout", () => {
  it("keeps the home experience centered, sparse, and assistant-led", () => {
    const css = readFileSync(
      new URL("./navigation-workspace.module.css", import.meta.url),
      "utf8",
    );
    const component = readFileSync(
      new URL("./navigation-workspace.tsx", import.meta.url),
      "utf8",
    );

    expect(css).toMatch(/\.experience\s*\{[\s\S]*width:\s*min\(100%,\s*720px\)/);
    expect(css).toMatch(/\.assistantStage\s*\{[\s\S]*width:\s*min\(100%,\s*520px\)/);
    expect(css).toMatch(/\.inputDock\s*\{[\s\S]*width:\s*min\(100%,\s*640px\)/);
    expect(css).toMatch(/\.answerPanel\s*\{[\s\S]*width:\s*min\(100%,\s*640px\)/);
    expect(css).toContain("@media (max-width: 760px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(component).toContain('aria-label="AI healthcare navigation workspace"');
    expect(component).toContain('placeholder="Tell me what is going on..."');
    expect(component).toContain("analyzeIntake(mode, currentInput)");
    expect(component).toContain("deterministicResult.urgency.level === 1");
    expect(component).not.toContain("actionCards");
    expect(component).not.toContain("bottomNav");
    expect(component).not.toContain("AuthPanel");
  });
});
