"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/clinic-time";
import { NOTIFY_CHANNELS, REMINDER_LEADS, reminderLeadLabel } from "@/lib/expert-portal";
import type { ExpertProfileView } from "@/lib/expert-data";
import { ActionButton, Field, SaveBar, Select, Toggle } from "@/components/expert/controls";
import { InlineAlert } from "@/components/expert/Panel";
import { send, stampNow } from "@/components/expert/request";
import { useToast } from "@/components/expert/Toast";

type Prefs = ExpertProfileView["notifications"];

const CHANNEL_LABELS: Record<(typeof NOTIFY_CHANNELS)[number], string> = {
  EMAIL: "Email only",
  WHATSAPP: "WhatsApp only",
  BOTH: "Email and WhatsApp",
};

const HOURS = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h += 1) out.push(String(h).padStart(2, "0") + ":00");
  return out;
})();

/**
 * Notification preferences.
 *
 * Two of these are not preferences and are shown as fixed: a new booking and a
 * cancellation always reach you. A practitioner who is not told a session
 * exists cannot turn up for it, and the client carries that cost, so it is not
 * ours to make optional.
 */
export default function NotificationForm({
  prefs,
  timezone,
  email,
}: {
  prefs: Prefs;
  timezone: string;
  email: string;
}) {
  const router = useRouter();
  const { saved, failed, toast } = useToast();

  const [draft, setDraft] = useState<Prefs>(prefs);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const sendTest = async () => {
    setTesting(true);
    const result = await send<{ delivered?: boolean; message?: string }>(
      "/api/expert/notifications/test",
      "POST"
    );
    setTesting(false);
    if (!result.ok) {
      failed("Test not sent", result.error);
      return;
    }
    toast({
      tone: result.data.delivered ? "success" : "info",
      title: result.data.delivered ? "Test email sent" : "Nothing left the building",
      detail: result.data.message,
    });
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs);

  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const save = async () => {
    setBusy(true);
    const result = await send<{ message?: string }>("/api/expert/notifications", "PATCH", {
      reminder: draft.reminder,
      reminderLeadMinutes: draft.reminderLeadMinutes,
      weeklyDigest: draft.weeklyDigest,
      productUpdates: draft.productUpdates,
      channel: draft.channel,
      quietHoursEnabled: draft.quietHoursEnabled,
      quietHoursStart: draft.quietHoursStart,
      quietHoursEnd: draft.quietHoursEnd,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      failed("Preferences not saved", result.error);
      return;
    }

    setSavedAt(stampNow());
    saved("Notification preferences saved", result.data.message);
    router.refresh();
  };

  return (
    <div className="p-5 sm:p-6">
      {error && (
        <div className="mb-5">
          <InlineAlert tone="danger" title="We could not save that">
            <p>{error}</p>
          </InlineAlert>
        </div>
      )}

      <section aria-labelledby="always-on">
        <h3 id="always-on" className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Always on
        </h3>
        <ul className="mt-2 divide-y divide-forest-800/[0.08]">
          {[
            {
              label: "A client books a session",
              hint: "Sent the moment a slot is taken, with the date, time and reference.",
            },
            {
              label: "A client cancels or reschedules",
              hint: "So you never hold an hour open for a session that is no longer happening.",
            },
          ].map((item) => (
            <li key={item.label} className="flex items-start justify-between gap-5 py-3.5">
              <div className="min-w-0">
                <p className="text-[0.92rem] font-medium text-forest-900">{item.label}</p>
                <p className="mt-0.5 text-[0.82rem] leading-snug text-ink/60">{item.hint}</p>
              </div>
              <span className="mt-0.5 shrink-0 rounded-full bg-sage-light/70 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-forest-800">
                Required
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="your-choice" className="mt-8">
        <h3 id="your-choice" className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Up to you
        </h3>
        <div className="mt-2 divide-y divide-forest-800/[0.08]">
          <Toggle
            checked={draft.reminder}
            onChange={(v) => set("reminder", v)}
            label="Remind me before each session"
            hint="One nudge with the client's first name and the join link."
          />
          <Toggle
            checked={draft.weeklyDigest}
            onChange={(v) => set("weeklyDigest", v)}
            label="Weekly summary on Monday morning"
            hint="Sessions booked, completed and no-shows for the week just gone."
          />
          <Toggle
            checked={draft.productUpdates}
            onChange={(v) => set("productUpdates", v)}
            label="Practice and product updates"
            hint="Occasional notes about new tools and clinical resources. Never marketing to your clients."
          />
        </div>

        {draft.reminder && (
          <div className="mt-5 max-w-sm">
            <Field label="Send the reminder" required>
              {({ id }) => (
                <Select
                  id={id}
                  value={String(draft.reminderLeadMinutes)}
                  onChange={(e) => set("reminderLeadMinutes", Number(e.target.value))}
                >
                  {REMINDER_LEADS.map((m) => (
                    <option key={m} value={m}>
                      {reminderLeadLabel(m)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}
      </section>

      <section aria-labelledby="channel" className="mt-8">
        <h3 id="channel" className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Where they go
        </h3>
        <div className="mt-3 max-w-sm">
          <Field label="Channel" required hint={"Email goes to " + email + "."}>
            {({ id, describedBy }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                value={draft.channel}
                onChange={(e) => set("channel", e.target.value)}
              >
                {NOTIFY_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </section>

      <section aria-labelledby="quiet" className="mt-8">
        <h3 id="quiet" className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Quiet hours
        </h3>
        <div className="mt-2 divide-y divide-forest-800/[0.08]">
          <Toggle
            checked={draft.quietHoursEnabled}
            onChange={(v) => set("quietHoursEnabled", v)}
            label="Hold non-urgent notifications overnight"
            hint={"Read in your own timezone (" + timezone + "). Booking and cancellation alerts still come through — they are time-critical."}
          />
        </div>

        {draft.quietHoursEnabled && (
          <div className="mt-5 grid max-w-md gap-5 sm:grid-cols-2">
            <Field label="From" required>
              {({ id }) => (
                <Select
                  id={id}
                  value={draft.quietHoursStart}
                  onChange={(e) => set("quietHoursStart", e.target.value)}
                >
                  {HOURS.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Until" required>
              {({ id }) => (
                <Select
                  id={id}
                  value={draft.quietHoursEnd}
                  onChange={(e) => set("quietHoursEnd", e.target.value)}
                >
                  {HOURS.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}
      </section>

      <div className="mt-8 rounded-xl border border-forest-800/10 bg-forest-800/[0.03] px-4 py-4">
        <p className="text-[0.86rem] font-semibold text-forest-900">A test is worth more than a guess</p>
        <p className="mt-1 text-[0.84rem] leading-relaxed text-ink/65">
          Send yourself one now, so you know what it looks like before a real booking depends on it.
          Tests go by email to {email}; WhatsApp delivery is connected by our team.
        </p>
        <div className="mt-3">
          <ActionButton tone="secondary" size="sm" onClick={sendTest} busy={testing}>
            Send a test email
          </ActionButton>
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        busy={busy}
        savedAt={savedAt}
        onSave={save}
        onReset={() => setDraft(prefs)}
        saveLabel="Save preferences"
      />
    </div>
  );
}
