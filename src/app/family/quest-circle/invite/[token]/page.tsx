import { notFound } from "next/navigation";
import { FamilyInviteAcceptPage } from "@/components/health-quest/family/family-invite-accept-page";

export default async function FamilyQuestCircleInviteRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 32 || token.length > 160) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))]">
      <FamilyInviteAcceptPage token={token} />
    </main>
  );
}
