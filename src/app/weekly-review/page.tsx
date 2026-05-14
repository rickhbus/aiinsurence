import { WeeklyReviewPage } from "@/components/health-quest/weekly-review/weekly-review-page";

export default function WeeklyReviewRoute() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-6">
      <WeeklyReviewPage locale="zh-Hant" />
    </main>
  );
}
