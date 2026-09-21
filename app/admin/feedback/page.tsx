import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { FEEDBACK_STATUS, publicName } from "@/lib/feedback";
import { formatDateISO } from "@/lib/utils";
import FeedbackReviewActions from "@/components/feedback/FeedbackReviewActions";

export const metadata: Metadata = { title: "Feedback | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const chip: Record<string, { label: string; cls: string }> = {
  [FEEDBACK_STATUS.pending]: { label: "Waiting for review", cls: "bg-gold/20 text-gold-dark" },
  [FEEDBACK_STATUS.approved]: { label: "Live on home page", cls: "bg-sage-light/70 text-forest-800" },
  [FEEDBACK_STATUS.hidden]: { label: "Not shown", cls: "bg-forest-800/8 text-ink/55" },
};

const order: Record<string, number> = {
  [FEEDBACK_STATUS.pending]: 0,
  [FEEDBACK_STATUS.approved]: 1,
  [FEEDBACK_STATUS.hidden]: 2,
};

export default async function AdminFeedbackPage() {
  const rows = (
    await prisma.feedback.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    })
  ).sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

  const pending = rows.filter((r) => r.status === FEEDBACK_STATUS.pending).length;

  return (
    <main className="wrap-wide pb-28">
      <p className="eyebrow">we heard you</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Feedback</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        Stories clients write from their dashboard. Nothing appears on the home page until you approve
        it. Check for crisis content, other people&apos;s names, or anything identifying before approving.
        {pending > 0 && (
          <span className="font-semibold text-forest-800"> {pending} waiting for review.</span>
        )}
      </p>

      <div className="mt-10 space-y-4">
        {rows.length === 0 ? (
          <p className="text-ink/60">No feedback yet.</p>
        ) : (
          rows.map((r) => {
            const c = chip[r.status] ?? chip[FEEDBACK_STATUS.pending];
            return (
              <article
                key={r.id}
                className="grid gap-6 rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift md:grid-cols-[5rem_1fr_auto] md:items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.avatar} alt="" className="h-20 w-20 object-contain object-bottom" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.cls}`}>{c.label}</span>
                    <span className="text-xs text-ink/50">
                      updated {formatDateISO(r.updatedAt.toISOString().slice(0, 10))}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg leading-relaxed text-forest-900">&ldquo;{r.quote}&rdquo;</p>
                  <p className="mt-2 text-sm text-ink/60">
                    Shown as <span className="font-semibold text-forest-800">{publicName(r.user.name, r.nameStyle === "initial" ? "initial" : "first")}</span>
                    {" · "}
                    {r.detail || "Emoraa client"}
                    <span className="text-ink/40"> — from {r.user.name}, {r.user.email}</span>
                  </p>
                </div>
                <FeedbackReviewActions id={r.id} status={r.status} />
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
