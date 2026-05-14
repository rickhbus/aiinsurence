import { Trophy } from "lucide-react";
import { healthLeagueNames, type HealthLeagueName } from "@/lib/health-quest/leagues";
import { cn } from "@/lib/utils";

const leagueClasses: Record<HealthLeagueName, string> = {
  Starter: "from-slate-200 to-slate-400 text-slate-950",
  Bronze: "from-orange-200 to-orange-500 text-slate-950",
  Silver: "from-slate-100 to-slate-300 text-slate-950",
  Gold: "from-amber-200 to-amber-500 text-slate-950",
  Jade: "from-teal-200 to-emerald-500 text-slate-950",
  Ruby: "from-rose-200 to-red-500 text-white",
  Diamond: "from-sky-100 to-cyan-400 text-slate-950",
};

export function PlayLeagueBadge({
  league,
  className,
}: {
  league: HealthLeagueName;
  className?: string;
}) {
  const safeLeague = healthLeagueNames.includes(league) ? league : "Starter";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br px-3 py-1.5 text-xs font-black shadow-sm", leagueClasses[safeLeague], className)}>
      <Trophy aria-hidden="true" className="size-4" />
      {safeLeague}
    </span>
  );
}

