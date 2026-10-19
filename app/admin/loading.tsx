import { Skeleton } from "@/components/ui/Feedback";

/** Shown under the admin nav while a list or report is fetched. */
export default function AdminLoading() {
  return (
    <section className="wrap-wide pb-28">
      <span className="sr-only" role="status">
        Loading
      </span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-12 w-72" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </section>
  );
}
