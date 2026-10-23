import { Skeleton } from "@/components/ui/Feedback";

/** Shown inside the portal shell while a page's sessions and records load; the nav stays put. */
export default function ExpertLoading() {
  return (
    <div className="space-y-6">
      <span className="sr-only" role="status">
        Loading
      </span>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-full max-w-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
