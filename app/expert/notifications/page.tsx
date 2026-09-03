import type { Metadata } from "next";
import { requireExpertContext } from "@/lib/expert-data";
import { CLINIC_TZ, formatTime } from "@/lib/clinic-time";
import { reminderLeadLabel } from "@/lib/expert-portal";
import { Meta, Panel, PanelHeader } from "@/components/expert/Panel";
import NotificationForm from "@/components/expert/NotificationForm";

export const metadata: Metadata = { title: "Notifications" };

export default async function ExpertNotificationsPage() {
  const ctx = await requireExpertContext("/expert/notifications");
  const n = ctx.profile.notifications;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="What is switched on now"
          hint="A summary of the settings below, in one place, so you can check it at a glance."
        />
        <dl className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <Meta label="Channel">
            {n.channel === "BOTH" ? "Email and WhatsApp" : n.channel === "WHATSAPP" ? "WhatsApp" : "Email"}
          </Meta>
          <Meta label="Session reminder">
            {n.reminder ? reminderLeadLabel(n.reminderLeadMinutes) : "Off"}
          </Meta>
          <Meta label="Weekly summary">{n.weeklyDigest ? "Monday morning" : "Off"}</Meta>
          <Meta label="Quiet hours">
            {n.quietHoursEnabled
              ? formatTime(n.quietHoursStart) + " – " + formatTime(n.quietHoursEnd)
              : "Off"}
          </Meta>
        </dl>
        <p className="px-5 pb-5 text-[0.82rem] leading-relaxed text-ink/55 sm:px-6 sm:pb-6">
          {ctx.profile.timezone === CLINIC_TZ ? (
            <>
              Quiet hours are read on clinic time ({CLINIC_TZ}) — the same clock as your sessions.
            </>
          ) : (
            <>
              Quiet hours are read on your own clock ({ctx.profile.timezone}). Session times
              everywhere else in the portal are clinic time ({CLINIC_TZ}), so the two do not line
              up — worth a look before you set them.
            </>
          )}
        </p>
      </Panel>

      <Panel>
        <PanelHeader
          title="Notification preferences"
          hint="Changes take effect on the next notification we send — nothing already queued is recalled."
        />
        <NotificationForm
          prefs={n}
          timezone={ctx.profile.timezone}
          email={ctx.session.email}
        />
      </Panel>
    </div>
  );
}
