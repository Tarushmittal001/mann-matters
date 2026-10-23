import { Skeleton } from "@/components/ui/Feedback";

/** Shown while posts are read from the database; shaped like the index and an article alike. */
export default function BlogLoading() {
  return (
    <div className="page-top wrap pb-28">
      <span className="sr-only" role="status">
        Loading
      </span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-5 h-12 w-full max-w-lg" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
