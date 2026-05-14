import { ReminderSettingsPage } from "@/components/health-quest/reminders/reminder-settings-page";

export default function ReminderSettingsRoute() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-6">
      <ReminderSettingsPage locale="zh-Hant" />
    </main>
  );
}
