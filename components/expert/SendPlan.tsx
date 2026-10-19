"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionButton } from "@/components/expert/controls";

/**
 * Preview and send the practice plan. The tasks reach the client's dashboard
 * the moment they are set; this is the "it's ready" email once the
 * practitioner has finished, rather than one message per task.
 */
export default function SendPlan({ sessionId }: { sessionId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  async function send() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/expert/sessions/${sessionId}/plan`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ tone: "warn", text: data.error || "That didn't go through." });
      } else if (data.delivered) {
        setMessage({ tone: "ok", text: "Sent. The client has an email with a link to the plan." });
      } else {
        setMessage({
          tone: "warn",
          text: "The email didn't go, but the plan is on the client's dashboard.",
        });
      }
    } catch {
      setMessage({ tone: "warn", text: "We couldn't reach the server. Nothing was sent." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <ActionButton size="sm" onClick={send} busy={busy}>
        Send plan to client
      </ActionButton>
      <Link href={`/plan/${sessionId}`} className="link-draw text-[0.85rem] font-medium text-forest-700">
        Preview on letterhead
      </Link>
      {message && (
        <p
          role="status"
          className={`w-full text-[0.84rem] ${message.tone === "ok" ? "text-forest-700" : "text-red-700"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
