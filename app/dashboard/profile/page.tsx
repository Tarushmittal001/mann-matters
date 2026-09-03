import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProfileForm from "@/components/profile/ProfileForm";
import PasswordForm from "@/components/profile/PasswordForm";
import { CrisisLine } from "@/components/ui/Feedback";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    // an allow-list, so `passwordHash` can never arrive here by accident
    select: {
      name: true,
      email: true,
      phone: true,
      phoneVerified: true,
      language: true,
      notes: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");

  const memberSince = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(user.createdAt);

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
            your profile
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Your details</h1>
          <p className="mt-4 max-w-xl text-ink/65">
            Only what we need to run your sessions well — nothing more. With us since{" "}
            {memberSince}.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="link-draw text-sm font-medium text-forest-800">
            My sessions
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="space-y-14">
          <section>
            <h2 className="font-display text-2xl font-medium text-forest-900">About you</h2>
            <div className="mt-6 max-w-xl">
              <ProfileForm
                initial={{
                  name: user.name,
                  email: user.email,
                  phone: user.phone ?? "",
                  phoneVerified: !!user.phoneVerified,
                  language: user.language ?? "",
                  notes: user.notes ?? "",
                  emailVerified: !!user.emailVerified,
                  memberSince: user.createdAt.toISOString(),
                }}
              />
            </div>
          </section>

          <section className="border-t border-forest-800/10 pt-12">
            <h2 className="font-display text-2xl font-medium text-forest-900">Password</h2>
            <p className="mt-2 max-w-xl text-[0.92rem] text-ink/60">
              We&apos;ll ask for your current password first — that&apos;s what stops a borrowed
              laptop from becoming a lost account.
            </p>
            <div className="mt-6 max-w-md">
              <PasswordForm />
            </div>
          </section>
        </div>

        {/* what we hold, said plainly */}
        <aside className="lg:pt-2">
          <div className="rounded-3xl border border-forest-800/10 bg-ivory-light p-7 shadow-lift">
            <h2 className="font-display text-lg font-medium text-forest-900">
              What we hold about you
            </h2>
            <ul className="mt-5 space-y-3.5 text-[0.86rem] leading-relaxed text-ink/65">
              {[
                ["Your name, email and mobile", "to reach you about your sessions."],
                ["Your bookings", "who you saw, when, and what you paid."],
                ["The card type and last four digits", "so you can recognise a payment. Never the full number."],
                ["Anything you write above", "shared only with the therapist you book."],
              ].map(([what, why]) => (
                <li key={what} className="flex gap-2.5">
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-medium text-forest-800">{what}</span> — {why}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-forest-800/10 pt-5 text-[0.82rem] leading-relaxed text-ink/55">
              We never see what happens inside a session. We don&apos;t sell data. To export or
              delete everything we hold,{" "}
              <Link href="/contact" className="font-medium text-forest-800 underline underline-offset-2">
                ask us
              </Link>{" "}
              and we&apos;ll do it within 30 days.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-16 border-t border-forest-800/10 pt-8">
        <CrisisLine />
      </div>
    </div>
  );
}
