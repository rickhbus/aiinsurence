import { AdvancedTodayDashboard } from "@/components/health-os/today-dashboard";
import { SimpleToday } from "@/components/simple-mode/simple-today";
import { defaultSimpleMode } from "@/lib/health-app/settings";

export default function TodayRoute() {
  return defaultSimpleMode ? <SimpleToday /> : <AdvancedTodayDashboard />;
}
