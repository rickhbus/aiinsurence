import { FamilyCirclePage } from "@/components/health-quest/family/family-circle-page";

export default function FamilyQuestCircleRoute() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-6">
      <FamilyCirclePage locale="zh-Hant" />
    </main>
  );
}
