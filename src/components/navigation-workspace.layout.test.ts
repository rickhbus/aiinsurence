import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive healthcare workspace layout", () => {
  it("uses a real responsive app shell instead of a centered phone mockup", () => {
    const css = readFileSync(
      new URL("./navigation-workspace.module.css", import.meta.url),
      "utf8",
    );
    const component = readFileSync(
      new URL("./navigation-workspace.tsx", import.meta.url),
      "utf8",
    );

    expect(css).toMatch(/\.appShell\s*\{[\s\S]*width:\s*min\(100%,\s*1180px\)/);
    expect(css).toMatch(/\.workspace\s*\{[\s\S]*grid-template-areas:[\s\S]*"hero assistant"/);
    expect(css).toMatch(/\.workspaceWithResult\s*\{[\s\S]*"hero result"[\s\S]*"input result"/);
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain("@media (max-width: 760px)");
    expect(css).toMatch(/\.actionGrid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.heroAvatar\s*\{[\s\S]*position:\s*relative/);
    expect(css).toMatch(/\.bottomNav\s*\{[\s\S]*display:\s*none/);
    expect(css).not.toContain(".phone");
    expect(css).not.toContain("border: 8px solid");
    expect(css).not.toContain("border-radius: 42px");
    expect(css).not.toContain("min-height: 844px");
    expect(component).toContain('aria-label="AI healthcare navigation workspace"');
    expect(component).not.toContain("mobile app preview");
    expect(component).not.toContain("statusBar");
  });
});
