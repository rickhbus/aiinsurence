import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientEnv } from "@/lib/env";

const surfaceLinks = [
  ["/onboarding", "Onboarding"],
  ["/today", "Today"],
  ["/today/advanced", "Advanced Today"],
  ["/learn", "Learn"],
  ["/weekly-review", "Weekly Review"],
  ["/family/quest-circle", "Family Circle"],
  ["/doctor/mission", "Doctor Mission"],
  ["/insurance/mission", "Insurance Mission"],
  ["/settings/reminders", "Reminders"],
  ["/progress", "Progress"],
] as const;

const checklist = [
  "Safety guidance: 999 / Accident & Emergency appears before quest rewards",
  "Recovery mode: non-punitive wording and no shame copy",
  "Insurance boundary: education only, no eligibility/pricing/coverage/claim/care-access claims",
  "Family sharing: no raw health details in invite or challenge payloads",
  "Doctor prep: disclaimer visible, print/copy/download available",
  "Reminders: no private health details, quiet hours respected",
  "Bilingual copy: Traditional Chinese first, English second where paired",
  "RLS: user-owned rows require Supabase auth and own-row policy",
] as const;

export default function HealthQuestQaRoute() {
  const env = getClientEnv();
  const explicit = process.env.HEALTH_QUEST_QA_ENABLED === "true";
  const productionLike = env.appEnv === "production" || process.env.VERCEL_ENV === "production";

  if (productionLike && !explicit) {
    notFound();
  }

  if (!explicit && !["local", "development", "test"].includes(env.appEnv)) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <section>
          <p className="text-sm font-semibold text-muted-foreground">Internal QA</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">Health Quest staging checklist</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            No user health data is loaded here. This route is local/dev by default and requires
            HEALTH_QUEST_QA_ENABLED=true in production-like environments.
          </p>
        </section>
        <section className="grid gap-3 sm:grid-cols-2">
          {surfaceLinks.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-lg border border-border/70 p-4 text-sm font-medium hover:bg-muted">
              {label}
              <span className="block pt-1 font-mono text-xs text-muted-foreground">{href}</span>
            </Link>
          ))}
        </section>
        <section className="rounded-lg border border-border/70 p-5">
          <h2 className="text-lg font-semibold">Release checks</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 h-2 w-2 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
