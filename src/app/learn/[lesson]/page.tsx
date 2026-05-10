import { HealthAppShell } from "@/components/health-app/app-shell";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lesson: string }>;
}) {
  const { lesson } = await params;

  return <HealthAppShell currentPage="lesson" lessonSlug={lesson} />;
}
