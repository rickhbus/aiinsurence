import { InsuranceMissionPage } from "@/components/health-quest/insurance-mission/insurance-mission-page";

export default function InsuranceMissionRoute() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-6">
      <InsuranceMissionPage locale="zh-Hant" />
    </main>
  );
}
