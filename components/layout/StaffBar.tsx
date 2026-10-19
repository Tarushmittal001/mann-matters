import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/auth/LogoutButton";

/**
 * The top of a workspace, not the top of a website.
 *
 * The portals used to sit under the marketing navbar, which offered a
 * practitioner mid-shift "Services", "For institutions", "Free tools" and a
 * gold "Book a session" button — an invitation to buy a session from the
 * person delivering it. Two navigations stacked, only one of them about the
 * work in front of them.
 *
 * So staff get their own bar. What belongs on it is only what someone at work
 * needs: where they are, who they are signed in as, and the way out. The
 * sections of the workspace are the portal's own business and stay where they
 * already live — pills in /admin, a sidebar in /expert.
 *
 * WHAT IS DELIBERATELY ABSENT
 *   Book a session, the catalogue, the blog, the language toggle — a workspace
 *   has no call to action, and nobody switches their admin tools to Hindi
 *   mid-task when every record in them is in English.
 *
 *   The red SOS pill is gone too, which is the one that deserves an argument.
 *   It is not a loss: a therapist who needs crisis numbers finds them under
 *   "Crisis protocol" in the sidebar, where it sits beside the rest of their
 *   clinical tools rather than shouting over the page. An admin reading a
 *   payout table never needed it.
 *
 * `View site` stays, because people who run a site have to be able to look at
 * it, and hunting for a way out of your own admin is its own small insult. It
 * opens in a new tab so a half-finished form is never lost to curiosity.
 */
export default function StaffBar({
  workspace,
  name,
  crossLink,
}: {
  /** "Operations", "Expert portal" — where this person is. */
  workspace: string;
  /** Who is signed in, so a shared machine cannot be mistaken for yours. */
  name: string;
  /** The other portal, for an admin who is also a practitioner. */
  crossLink?: { href: string; label: string };
}) {
  return (
    <div className="sticky top-0 z-50 border-b border-forest-800/10 bg-ivory/90 backdrop-blur-md">
      <div className="wrap-wide flex h-14 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="shrink-0" aria-label="Emoraa home">
            <Image
              src="/brand/emoraa-wordmark.png"
              alt="Emoraa"
              width={92}
              height={24}
              className="h-[1.05rem] w-auto"
              priority
            />
          </Link>
          <span className="h-4 w-px shrink-0 bg-forest-800/20" aria-hidden="true" />
          <span className="truncate text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-forest-800/70">
            {workspace}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-x-5">
          {crossLink && (
            <Link
              href={crossLink.href}
              className="link-draw hidden text-[0.85rem] font-medium text-forest-800 sm:inline"
            >
              {crossLink.label}
            </Link>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="link-draw hidden items-center gap-1 text-[0.85rem] font-medium text-ink/70 transition-colors hover:text-forest-800 sm:inline-flex"
          >
            View site
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M4 2h6v6M10 2 2.5 9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          {/* the name is not decoration: these screens hold other people's
              clinical records, and a shared desk should never leave you unsure
              whose account is open */}
          <span className="hidden max-w-[12rem] truncate text-[0.85rem] text-ink/70 md:inline">
            {name}
          </span>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
