import { BookingCardSkeleton, Skeleton } from "@/components/ui/Feedback";

/** Shown while the sessions list is fetched. Mirrors the real layout so the
 *  page doesn't jump when the content arrives. */
export default function DashboardLoading() {
  return (
    <div className="page-top wrap pb-28">
      <span className="sr-only" role="status">
        Loading your sessions
      </span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-5 h-12 w-64" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />

      <div className="mt-14">
        <Skeleton className="h-7 w-32" />
        <div className="mt-5 space-y-4">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      </div>
    </div>
  );
}
