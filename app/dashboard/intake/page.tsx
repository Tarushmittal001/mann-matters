import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { intakeState } from "@/lib/intake";
import { todayIST } from "@/lib/features/booking/policy";
import { formatDateISO } from "@/lib/utils";
import IntakeForm from "@/components/intake/IntakeForm";

export const metadata: Metadata = {
  title: "Before your first session",
  // clinical data; it has no business anywhere near an index
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/intake");

  const state = await intakeState(session.sub, todayIST());

  return (
    <div className="page-top wrap pb-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span
              className="font-deva text-sm normal-case tracking-normal text-gold"
              aria-hidden="true"
            >
              मन
            </span>
            before you start
          </p>
          <h1 className="h-display text-4xl md:text-5xl">
            {state.filled ? "Your intake form" : "Twelve minutes now, twenty saved later."}
          </h1>
          <p className="mt-4 max-w-xl text-ink/65">
            {state.filled
              ? "Your therapist has this. Change anything you like — they'll see the latest version."
              : "Your therapist reads this before you meet, so the session can start where you actually are rather than with the basics. Nothing here is compulsory except the safety questions."}
          </p>
        </div>
        <Link href="/dashboard" className="link-draw text-sm font-medium text-forest-800">
          My sessions
        </Link>
      </div>

      {state.needsItBefore && (
        <p className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-[0.9rem] text-forest-900">
          You&apos;re seeing {state.needsItBefore.expertName} on{" "}
          {formatDateISO(state.needsItBefore.date)} at {state.needsItBefore.time}. Filling this in
          before then gives you most of that hour back.
        </p>
      )}

      <div className="mt-12">
        <IntakeForm
          initial={state.form}
          minor={state.minor}
          savedAt={
            state.updatedAt
              ? new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                }).format(state.updatedAt)
              : null
          }
        />
      </div>
    </div>
  );
}
