import { DoctorMissionPage } from "@/components/health-quest/doctor-mission/doctor-mission-page";

export default function DoctorMissionRoute() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-6">
      <DoctorMissionPage locale="zh-Hant" />
    </main>
  );
}
