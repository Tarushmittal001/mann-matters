import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mailerConfigured } from "@/lib/email";
import { hasSmsProvider } from "@/lib/sms";
import {
  FREE_CHANGE_HOURS,
  HOLD_MINUTES,
  HORIZON_DAYS,
  MAX_RESCHEDULES,
  REQUEST_HOURS,
} from "@/lib/features/booking/policy";

export const metadata: Metadata = { title: "Settings | Admin", robots: { index: false, follow: false } };
// read at request time: a key set on the host shows up without a rebuild
export const dynamic = "force-dynamic";

/**
 * What this deployment is actually running with.
 *
 * Read-only on purpose. Keys and provider credentials live in the host's
 * environment, where a leaked admin cookie cannot change them; this page only
 * reports whether each one is SET, never its value. Booking rules are read from
 * the policy module itself, so the numbers here cannot drift from the code
 * that enforces them.
 */

type Tone = "on" | "off" | "warn";
type Item = { label: string; value: string; tone: Tone; detail: string };

const has = (name: string) => !!process.env[name]?.trim();

function emailStatus(): Item {
  if (has("GMAIL_USER") && has("GMAIL_APP_PASSWORD")) {
    return { label: "Email", value: "Gmail SMTP", tone: "on", detail: "Verification, password reset, invites and session emails are delivered." };
  }
  if (mailerConfigured()) {
    return { label: "Email", value: "Resend", tone: "on", detail: "Verification, password reset, invites and session emails are delivered." };
  }
  return {
    label: "Email",
    value: "Not connected",
    tone: "warn",
    detail: "No provider is set, so links are written to the server log instead of sent. Set RESEND_API_KEY (or Gmail SMTP) before launch.",
  };
}

function integrations(): Item[] {
  const sentry = has("SENTRY_DSN") || has("NEXT_PUBLIC_SENTRY_DSN");
  return [
    {
      label: "Payments",
      value: "Simulated",
      tone: "warn",
      detail: "lib/payments.ts stands in for a gateway: no money moves and refunds are recorded, not paid. A real gateway with webhook confirmation is needed before launch.",
    },
    emailStatus(),
    hasSmsProvider()
      ? { label: "SMS (phone sign-in)", value: "Twilio", tone: "on", detail: "One-time codes are texted. Codes expire after 5 minutes." }
      : {
          label: "SMS (phone sign-in)",
          value: "Not connected",
          tone: "warn",
          detail: "Without Twilio, production refuses phone sign-in and signup cannot text a code. Set all three TWILIO_* values.",
        },
    has("ANTHROPIC_API_KEY")
      ? {
          label: "Manu assistant",
          value: process.env.ANTHROPIC_MODEL?.trim() || "Connected",
          tone: "on",
          detail: "Crisis terms are caught before any message reaches the model.",
        }
      : {
          label: "Manu assistant",
          value: "Not connected",
          tone: "off",
          detail: "Without ANTHROPIC_API_KEY, Manu shows an unavailable state. Crisis routing still works.",
        },
    sentry
      ? { label: "Error tracking", value: "Sentry", tone: "on", detail: "Request bodies, cookies and query strings are stripped before events are sent." }
      : { label: "Error tracking", value: "Not connected", tone: "warn", detail: "Server errors are only visible in the host's logs. Set SENTRY_DSN." },
    has("NEXT_PUBLIC_POSTHOG_KEY")
      ? { label: "Analytics", value: "PostHog", tone: "on", detail: "Loads only after cookie consent; page views on public pages only." }
      : { label: "Analytics", value: "Off", tone: "off", detail: "No analytics are collected." },
  ];
}

function bookingRules(): Item[] {
  return [
    { label: "Booking window", value: `${HORIZON_DAYS} days`, tone: "on", detail: "How far ahead clients can book. All dates are India Standard Time." },
    { label: "Request response time", value: `${REQUEST_HOURS} hours`, tone: "on", detail: "A request lapses if the practitioner has not answered by then (or two hours before the session)." },
    { label: "Payment hold", value: `${HOLD_MINUTES} minutes`, tone: "on", detail: "How long an accepted slot is held while the client pays." },
    { label: "Free changes", value: `Up to ${FREE_CHANGE_HOURS} hours before`, tone: "on", detail: `Cancel for a full refund, or reschedule up to ${MAX_RESCHEDULES} times.` },
  ];
}

const toneClass: Record<Tone, string> = {
  on: "bg-sage-light/70 text-forest-800",
  off: "bg-forest-800/5 text-ink/70",
  warn: "bg-gold/20 text-gold-dark",
};

function Card({ item }: { item: Item }) {
  return (
    <section className="rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl font-medium text-forest-900">{item.label}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass[item.tone]}`}>{item.value}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">{item.detail}</p>
    </section>
  );
}

export default async function AdminSettingsPage() {
  // checked here too, not only in the layout: a page must not rely on its parent
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/settings");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const policies = await prisma.expertProfile.groupBy({ by: ["notesPolicy"], _count: { _all: true } });
  const count = (p: string) => policies.find((r) => r.notesPolicy === p)?._count._all ?? 0;
  const linked = policies.reduce((n, r) => n + r._count._all, 0);

  const items = integrations();
  const pending = items.filter((i) => i.tone === "warn").length;
  const environment = process.env.APP_ENV?.trim() || process.env.NODE_ENV || "unknown";

  return (
    <section className="wrap-wide pb-28">
      <p className="eyebrow">workspace settings</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Settings</h1>
      <p className="mt-4 max-w-2xl text-ink/70">
        What this deployment (<strong className="font-semibold text-forest-800">{environment}</strong>) is
        running with right now.{" "}
        {pending > 0
          ? `${pending} integration${pending === 1 ? " needs" : "s need"} attention before launch.`
          : "Every launch integration is connected."}{" "}
        Keys are set in the host's environment, not here.
      </p>

      <h2 className="mt-12 font-display text-2xl font-medium text-forest-900">Integrations</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.label} item={item} />
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl font-medium text-forest-900">Clinical governance</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card
          item={{
            label: "Session notes",
            value: `${count("APPROVED")} of ${linked} enabled`,
            tone: count("APPROVED") > 0 ? "on" : "off",
            detail: `Practitioners with a login: ${count("APPROVED")} enabled, ${count("PENDING")} pending, ${count("BLOCKED")} held in their own system. Change it per practitioner from Experts → Manage.`,
          }}
        />
        <Card
          item={{
            label: "Admin model",
            value: "Single ADMIN role",
            tone: "off",
            detail: "Every admin can do everything here, and each change is written to the audit trail. Use strong, unique passwords for admin accounts.",
          }}
        />
      </div>

      <h2 className="mt-12 font-display text-2xl font-medium text-forest-900">Booking rules</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Read from lib/features/booking/policy.ts, the module that enforces them. Changing one is a code change.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {bookingRules().map((item) => (
          <Card key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}
