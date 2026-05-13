import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("shadcn navigation workspace composition", () => {
  it("uses shadcn app primitives while preserving safety-critical UI text", () => {
    const component = readFileSync(
      new URL("./navigation-workspace.tsx", import.meta.url),
      "utf8",
    );
    const providers = readFileSync(
      new URL("./app-providers.tsx", import.meta.url),
      "utf8",
    );
    const authPanel = readFileSync(
      new URL("./auth/auth-panel.tsx", import.meta.url),
      "utf8",
    );
    const memoryCard = readFileSync(
      new URL("./memory/memory-consent-card.tsx", import.meta.url),
      "utf8",
    );

    expect(component).toContain("@/components/ui/tabs");
    expect(component).toContain("@/components/ui/sheet");
    expect(component).toContain("@/components/ui/dialog");
    expect(component).toContain("@/components/ui/drawer");
    expect(component).toContain("HumanDoctor3D");
    expect(component).toContain("醫療導航");
    expect(component).toContain("Insurance planning");
    expect(component).toContain("Policy / claims");
    expect(component).toContain("致電 999 / Call 999");
    expect(component).toContain("Emergency guidance is not saved");
    expect(component).toContain("AI 醫療導航，不取代醫生診斷");
    expect(component).toContain("getSupabaseRequestHeaders");
    expect(component).toContain("headers: sessionHeaders");
    expect(component).toContain("headers: recommendationHeaders");
    expect(component).not.toContain("human-ai-home.module.css");
    expect(providers).toContain("TooltipProvider");
    expect(providers).toContain("Toaster");
    expect(authPanel).toContain("匿名開始 / Start anonymously");
    expect(authPanel).toContain("GOOGLE_OAUTH_ENABLED");
    expect(memoryCard).toContain("保存 / Save");
    expect(memoryCard).toContain("今次不要 / Not now");
    expect(memoryCard).toContain("查看會保存甚麼 / See what will be saved");
  });
});
