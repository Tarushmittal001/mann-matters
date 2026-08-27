import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings | Admin" };

const settings = [
  { label: "Authentication", value: "Email verification enabled", detail: "Users must confirm their email before booking." },
  { label: "Booking window", value: "14 days", detail: "Dates are validated using India Standard Time." },
  { label: "Slot protection", value: "Enabled", detail: "One active booking is allowed per expert, date, and time." },
  { label: "Payments", value: "Not connected", detail: "Payment gateway and refunds need to be configured before launch." },
  { label: "Notifications", value: "Verification email only", detail: "Booking confirmations, reminders, and WhatsApp notifications are not connected yet." },
  { label: "Database", value: "SQLite", detail: "Suitable for local development. Use a managed database for production." },
];

export default function AdminSettingsPage() {
  return (
    <main className="wrap-wide pb-28">
      <p className="eyebrow">workspace settings</p>
      <h1 className="h-display mt-3 text-4xl md:text-5xl">Settings</h1>
      <p className="mt-4 max-w-xl text-ink/65">A clear view of the current platform configuration and the launch items still needing an integration.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {settings.map((setting) => <section key={setting.label} className="rounded-2xl border border-forest-800/10 bg-ivory-light p-6 shadow-lift"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-medium text-forest-900">{setting.label}</h2><span className="rounded-full bg-sage-light/70 px-3 py-1 text-xs font-semibold text-forest-800">{setting.value}</span></div><p className="mt-3 text-sm leading-relaxed text-ink/60">{setting.detail}</p></section>)}
      </div>
      <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6"><h2 className="font-display text-2xl font-medium text-forest-900">Single-admin model</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/70">This workspace uses one operational ADMIN role. Super-admin separation is intentionally not enabled; secure the account with a strong password, MFA when available, and careful access logging before launch.</p></section>
    </main>
  );
}
