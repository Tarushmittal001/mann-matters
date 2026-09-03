import { Skeleton } from "@/components/ui/Feedback";

export default function BookLoading() {
  return (
    <div className="page-top wrap pb-28">
      <span className="sr-only" role="status">
        Loading the booking flow
      </span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-5 h-12 w-full max-w-lg" />
      <div className="mt-12 flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[3px] flex-1 rounded-full" />
        ))}
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
