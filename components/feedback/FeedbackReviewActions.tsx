"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FEEDBACK_STATUS } from "@/lib/feedback";

/** Approve / hide buttons for one feedback row on /admin/feedback. */
export default function FeedbackReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "hide">(null);
  const [error, setError] = useState("");

  const act = async (action: "approve" | "hide") => {
    setBusy(action);
    setError("");
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't update. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {status !== FEEDBACK_STATUS.approved && (
        <button
          type="button"
          onClick={() => act("approve")}
          disabled={!!busy}
          className="rounded-full bg-forest-800 px-4 py-2 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700 disabled:opacity-60"
        >
          {busy === "approve" ? "Approving…" : "Approve & show"}
        </button>
      )}
      {status !== FEEDBACK_STATUS.hidden && (
        <button
          type="button"
          onClick={() => act("hide")}
          disabled={!!busy}
          className="rounded-full border border-forest-800/20 px-4 py-2 text-sm font-medium text-forest-800 transition-colors hover:border-forest-800 disabled:opacity-60"
        >
          {busy === "hide" ? "Hiding…" : status === FEEDBACK_STATUS.approved ? "Take down" : "Don't show"}
        </button>
      )}
      {error && <p className="w-full text-[0.82rem] text-red-700">{error}</p>}
    </div>
  );
}
