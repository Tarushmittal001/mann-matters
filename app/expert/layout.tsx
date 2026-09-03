import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getExpertContext } from "@/lib/expert-data";
import LogoutButton from "@/components/auth/LogoutButton";
import ExpertNav, { type NavItem } from "@/components/expert/ExpertNav";
import TimezoneNote from "@/components/expert/TimezoneNote";
import ToastProvider from "@/components/expert/Toast";
import { EmptyState, Panel } from "@/components/expert/Panel";

export const metadata: Metadata = {
  title: { default: "Expert portal", template: "%s · Expert portal" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ExpertLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getExpertContext();

  if (ctx.state === "anonymous") redirect("/login?next=/expert");
  if (ctx.state === "wrong-role") redirect("/dashboard");

  /* An account can carry the EXPERT role before ops has linked it to a
     practitioner record. That is a real state, so it gets a real screen
     rather than a crash. */
  if (ctx.state === "unlinked") {
    return (
      <div className="page-top wrap pb-28">
        <Panel className="mt-6 p-2">
          <EmptyState
            icon="lock"
            title="Your practitioner record isn't linked yet"
            body={
              <>
                You are signed in as {ctx.session.email}, but this account has no practice attached
                to it — so there is no calendar, no client list and nothing to edit. Our operations
                team links the two once your onboarding paperwork is in.
              </>
            }
            action={
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="rounded-full bg-forest-800 px-5 py-2.5 text-[0.9rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
                >
                  Contact the team
                </Link>
                <LogoutButton />
              </div>
            }
          />
        </Panel>
      </div>
    );
  }

  const todaysSessions = await prisma.booking.count({
    where: { expertId: ctx.profile.expertId, date: ctx.today, status: "CONFIRMED" },
  });

  const items: NavItem[] = [
    {
      href: "/expert",
      label: "Today",
      hint: "What is happening in the next few hours",
      badge: todaysSessions || undefined,
    },
    { href: "/expert/sessions", label: "Sessions", hint: "Every booking, past and upcoming" },
    { href: "/expert/availability", label: "Availability", hint: "Weekly hours and time off" },
    { href: "/expert/profile", label: "Profile", hint: "How clients see you" },
    { href: "/expert/notifications", label: "Notifications", hint: "What reaches you, and how" },
  ];

  return (
    <ToastProvider>
      <a
        href="#expert-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-forest-800 focus:px-5 focus:py-2.5 focus:text-[0.9rem] focus:font-semibold focus:text-ivory"
      >
        Skip to portal content
      </a>

      <div className="page-top wrap-wide pb-28">
        <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <p className="eyebrow mb-3 flex items-center gap-3">
              <span
                className="font-deva text-sm normal-case tracking-normal text-gold"
                aria-hidden="true"
              >
                मन
              </span>
              expert portal
            </p>
            <h1 className="h-display text-3xl md:text-4xl">
              {ctx.session.name}
              {ctx.listing ? (
                <span className="ml-3 align-middle text-base font-normal text-ink/55">
                  {ctx.listing.credentials}
                </span>
              ) : null}
            </h1>
            <div className="mt-3">
              <TimezoneNote profileTimezone={ctx.profile.timezone} initialTime={ctx.nowTime} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {ctx.session.role === "ADMIN" && (
              <Link href="/admin" className="link-draw text-sm font-medium text-forest-800">
                Admin portal
              </Link>
            )}
            <LogoutButton />
          </div>
        </header>

        <div className="mt-8 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10">
          <ExpertNav items={items} role={ctx.session.role} />
          <main id="expert-main" className="mt-6 min-w-0 lg:mt-0">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
