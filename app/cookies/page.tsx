import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import CookieSettingsButton from "@/components/legal/CookieSettingsButton";

export const metadata: Metadata = {
  title: "Cookie policy",
  alternates: { canonical: "/cookies" },
  description:
    "The cookies and browser storage Emoraa uses, why, and how to change your choice. Analytics only runs if you say yes.",
};

/* Keep the tables in step with the code: grep for cookies().set and localStorage. */

type Row = { name: string; purpose: string; lasts: string };

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-forest-800/10">
      <table className="w-full min-w-[32rem] text-left text-[0.92rem]">
        <thead className="bg-sage-light/30 text-forest-900">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Name</th>
            <th scope="col" className="px-4 py-3 font-semibold">What it does</th>
            <th scope="col" className="px-4 py-3 font-semibold">How long</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-forest-800/10">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="px-4 py-3 font-mono text-[0.85rem] text-forest-900">{r.name}</td>
              <td className="px-4 py-3">{r.purpose}</td>
              <td className="whitespace-nowrap px-4 py-3">{r.lasts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sections: LegalSection[] = [
  {
    id: "what",
    heading: "What cookies are",
    body: (
      <p>
        Cookies and similar browser storage are small pieces of data a website saves on your device. Some are
        needed for a site to work at all. Others are optional and help the people running it understand how
        it&apos;s used.
      </p>
    ),
  },
  {
    id: "essential",
    heading: "Essential: always on",
    body: (
      <>
        <p>These are needed for the service you asked for, so they don&apos;t need your consent:</p>
        <Table
          rows={[
            { name: "emoraa_session", purpose: "Keeps you signed in securely.", lasts: "7 days, or until you sign out" },
            {
              name: "emoraa_verified_email / _phone",
              purpose: "Remembers that you already verified your email or phone on the contact form, so you aren't asked again.",
              lasts: "30 days",
            },
            { name: "emoraa_consent", purpose: "Remembers your cookie choice (browser storage).", lasts: "Until you clear it" },
          ]}
        />
      </>
    ),
  },
  {
    id: "preferences",
    heading: "Preferences: stored only on your device",
    body: (
      <>
        <p>These never leave your browser:</p>
        <ul>
          <li>your worry-journal entries, if you choose to save them;</li>
          <li>the language you picked in the Manu demo;</li>
          <li>whether you dismissed the &ldquo;install the app&rdquo; prompt.</li>
        </ul>
      </>
    ),
  },
  {
    id: "analytics",
    heading: "Analytics: only if you say yes",
    body: (
      <>
        <p>
          If you allow analytics, PostHog counts anonymous page views on our public pages, like which articles
          get read and which tools get used. It is set up to collect as little as possible: no session
          recording, no automatic click tracking, and it respects your browser&apos;s &ldquo;Do Not Track&rdquo;
          setting. It <strong>never</strong> runs on your dashboard, bookings, sign-in, or crisis pages.
        </p>
        <Table
          rows={[
            {
              name: "ph_* (browser storage)",
              purpose: "An anonymous ID so repeat visits aren't double-counted.",
              lasts: "Until you withdraw consent",
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "no-ads",
    heading: "No advertising cookies",
    body: <p>We don&apos;t use advertising or cross-site tracking cookies, and we don&apos;t sell data.</p>,
  },
  {
    id: "choice",
    heading: "Changing your choice",
    body: (
      <>
        <p>
          You can change your mind at any time. If you withdraw consent, analytics stops and its stored ID is
          cleared.
        </p>
        <CookieSettingsButton className="inline-flex min-h-11 items-center rounded-full bg-forest-800 px-6 text-sm font-semibold text-ivory transition-colors hover:bg-forest-900" />
        <p>
          You can also block or delete cookies in your browser settings, though if you block essential cookies
          you won&apos;t be able to sign in. For more about how we handle personal data, see our{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="your data"
      title="Cookie policy"
      updated="2026-10-06"
      current="/cookies"
      intro={<p>Short version: we keep you signed in, and we only count page views if you say yes.</p>}
      sections={sections}
    />
  );
}
