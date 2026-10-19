import type { Metadata } from "next";
import { requireExpertContext } from "@/lib/expert-data";
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
        <dl className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
          <Meta label="Channel">
            {n.channel === "BOTH" ? "Email and WhatsApp" : n.channel === "WHATSAPP" ? "WhatsApp" : "Email"}
          </Meta>
          <Meta label="Session reminder">
            {n.reminder ? reminderLeadLabel(n.reminderLeadMinutes) : "Off"}
          </Meta>
        </dl>
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
