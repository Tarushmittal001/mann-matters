import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { REFERRAL_VALUE } from "@/lib/coupons";
import { referralSummary } from "@/lib/referral";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import ShareCode from "@/components/referral/ShareCode";

export const metadata: Metadata = {
  title: "Invite a friend",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The referral page.
 *
 * It is deliberately quiet about the people involved. A referral page that
 * listed "Ananya — booked Tuesday" would be telling one person that another is
 * in therapy, which is not ours to tell. So this counts, and says nothing else.
 */
export default async function ReferralsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/referrals");

  const summary = await referralSummary(session.sub);
  const shareUrl = `${site.url}/book?ref=${encodeURIComponent(summary.code)}`;

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
            invite a friend
          </p>
          <h1 className="h-display text-4xl md:text-5xl">
            {formatINR(REFERRAL_VALUE)} for them, {formatINR(REFERRAL_VALUE)} for you.
          </h1>
          <p className="mt-4 max-w-xl text-ink/65">
            Most people book their first session because somebody they trust told them to. If that
            was you for someone, this makes it a little easier for both of you.
          </p>
        </div>
        <Link href="/dashboard" className="link-draw text-sm font-medium text-forest-800">
          My sessions
        </Link>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        <ShareCode code={summary.code} url={shareUrl} value={REFERRAL_VALUE} />

        <div className="space-y-8">
          {/* what it has done so far */}
          <section className="rounded-3xl border border-forest-800/10 bg-ivory-light p-7">
            <p className="eyebrow mb-5">where you stand</p>
            <dl className="grid grid-cols-2 gap-6">
              <div>
                <dt className="text-[0.82rem] text-ink/70">Friends who booked</dt>
                <dd className="mt-1 font-display text-3xl font-medium text-forest-900">
                  {summary.joined}
                </dd>
              </div>
              <div>
                <dt className="text-[0.82rem] text-ink/70">Credit waiting for you</dt>
                <dd className="mt-1 font-display text-3xl font-medium text-forest-900">
                  {formatINR(summary.creditAvailable)}
                </dd>
              </div>
            </dl>

            {summary.openCodes.length > 0 && (
              <div className="mt-7 border-t border-forest-800/10 pt-6">
                <p className="text-[0.82rem] text-ink/70">
                  Type {summary.openCodes.length === 1 ? "this" : "one of these"} into the code box
                  when you book your next session:
                </p>
                <ul className="mt-3 space-y-2">
                  {summary.openCodes.map((c) => (
                    <li
                      key={c.code}
                      className="flex items-center justify-between gap-4 rounded-xl bg-sage-light/40 px-4 py-2.5"
                    >
                      <span className="font-mono text-[0.92rem] font-semibold text-forest-800">
                        {c.code}
                      </span>
                      <span className="text-[0.85rem] text-ink/65">{formatINR(c.value)} off</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.joined === 0 && (
              <p className="mt-6 border-t border-forest-800/10 pt-5 text-[0.88rem] leading-relaxed text-ink/70">
                Nobody has used your code yet. It never expires, so there is no rush.
              </p>
            )}

            {summary.creditUsed > 0 && (
              <p className="mt-5 text-[0.82rem] text-ink/70">
                You have already used {formatINR(summary.creditUsed)} of referral credit.
              </p>
            )}
          </section>

          {/* the rules, in full */}
          <section className="rounded-3xl border border-forest-800/10 bg-sage-light/25 p-7">
            <p className="eyebrow mb-4">how it works</p>
            <ol className="space-y-3.5 text-[0.92rem] leading-relaxed text-ink/70">
              <li className="flex gap-3">
                <span className="font-display text-forest-800">1.</span>
                <span>
                  They type your code into the box on the booking screen.{" "}
                  {formatINR(REFERRAL_VALUE)} comes off there and then.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-forest-800">2.</span>
                <span>
                  Once they have actually been to the session, your{" "}
                  {formatINR(REFERRAL_VALUE)} appears on this page as a code of your own.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-forest-800">3.</span>
                <span>You use it on your next session. It does not expire.</span>
              </li>
            </ol>
            <p className="mt-6 border-t border-forest-800/10 pt-5 text-[0.8rem] leading-relaxed text-ink/70">
              A code works on a first session only, and not on your own account. We will never tell
              you what your friend booked, who they saw, or what they talked about — you will only
              ever see a number on this page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
