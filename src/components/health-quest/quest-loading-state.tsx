import { Skeleton } from "@/components/ui/skeleton";

export function QuestLoadingState() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-40 rounded-3xl" />
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}
