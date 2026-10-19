import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { couponState } from "@/lib/coupons";
import { formatINR } from "@/lib/utils";
import CouponForm from "@/components/admin/CouponForm";
import CouponActions from "@/components/admin/CouponActions";

export const metadata: Metadata = {
  title: "Discount codes | Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const tone: Record<string, string> = {
  live: "bg-sage-light/70 text-forest-800",
  spent: "bg-forest-800/8 text-ink/70",
  off: "bg-gold/20 text-gold-dark",
};

function shortDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export default async function AdminCouponsPage() {
  const now = new Date();

  const [coupons, given, referrals] = await Promise.all([
    prisma.coupon.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { redemptions: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.couponRedemption.aggregate({ _sum: { amount: true }, _count: true }),
    // discounts that came off a referral code leave no redemption row: the
    // proof is on the booking itself
    prisma.booking.findMany({
      where: { couponCode: { not: null }, fullAmount: { not: null } },
      select: { amount: true, fullAmount: true, couponCode: true },
    }),
  ]);

  const campaign = coupons.filter((c) => !c.ownerId);
  const rewards = coupons.filter((c) => !!c.ownerId);

  const couponCodes = new Set(coupons.map((c) => c.code));
  const referralOff = referrals
    .filter((b) => b.couponCode && !couponCodes.has(b.couponCode))
    .reduce((sum, b) => sum + ((b.fullAmount ?? b.amount) - b.amount), 0);

  return (
    <section className="wrap-wide pb-28">
      <p className="eyebrow">money off</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Discount codes</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        Campaign codes you make, and the referral rewards clients have earned. A code is checked
        again at booking and once more at payment, so nothing here can be spent twice or past its
        date.
      </p>

      {/* what it has cost so far */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
          <p className="text-[0.78rem] uppercase tracking-[0.14em] text-ink/70">Codes redeemed</p>
          <p className="mt-1.5 font-display text-3xl font-medium text-forest-900">
            {given._count}
          </p>
        </div>
        <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
          <p className="text-[0.78rem] uppercase tracking-[0.14em] text-ink/70">Given away</p>
          <p className="mt-1.5 font-display text-3xl font-medium text-forest-900">
            {formatINR(given._sum.amount ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-forest-800/10 bg-ivory-light p-5">
          <p className="text-[0.78rem] uppercase tracking-[0.14em] text-ink/70">Via referrals</p>
          <p className="mt-1.5 font-display text-3xl font-medium text-forest-900">
            {formatINR(referralOff)}
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[22rem_1fr] lg:items-start">
        <CouponForm />

        <div className="space-y-12">
          <section>
            <h2 className="font-display text-2xl font-medium text-forest-900">Campaign codes</h2>
            {campaign.length === 0 ? (
              <p className="mt-4 text-ink/70">
                No codes yet. The form makes one, and it works the moment it exists.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {campaign.map((c) => {
                  const state = couponState(c, now);
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-forest-800/10 bg-ivory-light p-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-[1rem] font-semibold text-forest-900">
                            {c.code}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] ${tone[state.tone]}`}
                          >
                            {state.label}
                          </span>
                        </div>
                        <p className="mt-1 text-[0.88rem] text-ink/65">
                          {c.kind === "PERCENT" ? `${c.value}% off` : `${formatINR(c.value)} off`}
                          {" · "}
                          used {c.usedCount}
                          {c.maxUses !== null ? ` of ${c.maxUses}` : " times"}
                          {c.expiresAt ? ` · until ${shortDate(c.expiresAt)}` : ""}
                        </p>
                        {c.note && <p className="mt-1 text-[0.82rem] text-ink/70">{c.note}</p>}
                      </div>
                      <CouponActions
                        id={c.id}
                        code={c.code}
                        paused={c.status !== "ACTIVE"}
                        used={c.usedCount > 0}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl font-medium text-forest-900">Referral rewards</h2>
            <p className="mt-2 max-w-xl text-[0.9rem] text-ink/70">
              Made automatically when somebody&apos;s friend attends their first session. They
              belong to the client who earned them, so only that account can spend one.
            </p>
            {rewards.length === 0 ? (
              <p className="mt-4 text-ink/70">Nobody has earned one yet.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {rewards.map((c) => {
                  const state = couponState(c, now);
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-forest-800/10 bg-ivory-light p-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-[0.95rem] font-semibold text-forest-900">
                            {c.code}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] ${tone[state.tone]}`}
                          >
                            {state.label}
                          </span>
                        </div>
                        <p className="mt-1 text-[0.88rem] text-ink/65">
                          {formatINR(c.value)} for {c.owner?.name ?? "a client"}
                          {c.owner?.email ? ` (${c.owner.email})` : ""}
                        </p>
                        {c.note && <p className="mt-1 text-[0.82rem] text-ink/70">{c.note}</p>}
                      </div>
                      <CouponActions id={c.id} code={c.code} paused={c.status !== "ACTIVE"} used />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
