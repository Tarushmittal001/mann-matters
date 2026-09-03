"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatClinicTime, formatDate, humanGap } from "@/lib/clinic-time";
import {
  STATUS_META,
  sessionMinutesAway,
  sessionPhase,
  type SessionStatus,
} from "@/lib/expert-portal";
import type { ExpertSessionView } from "@/lib/expert-data";
import { ActionButton, ConfirmDialog, Field, TextArea } from "@/components/expert/controls";
import { InlineAlert } from "@/components/expert/Panel";
import { send } from "@/components/expert/request";
import { useToast } from "@/components/expert/Toast";
import { useNow } from "@/components/ui/useNow";

/**
 * Session status, and the only place it changes.
 *
 * What is offered depends on where the session sits in time, so the practitioner
 * is never shown an action the server would refuse: outcomes appear once the
 * session has started, cancellation disappears at that moment, and a cancelled
 * session offers nothing at all.
 */
export default function SessionStatusControl({
  session,
  sessionMinutes,
  serverNow,
  compact = false,
}: {
  session: Pick<ExpertSessionView, "id" | "ref" | "date" | "time" | "status" | "meetingUrl">;
  sessionMinutes: number;
  serverNow: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const { saved, failed } = useToast();
  const now = useNow(serverNow);

  const [pending, setPending] = useState<SessionStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const phase = sessionPhase(session, sessionMinutes, now);
  const away = sessionMinutesAway(session, now);
  const started = away <= 0;

  const canRecordOutcome = session.status === "CONFIRMED" && started;
  const canCancel = session.status === "CONFIRMED" && !started;
  const canCorrect = session.status === "COMPLETED" || session.status === "NO_SHOW";
  const lateCancel = canCancel && away < 24 * 60;

  const run = async (status: SessionStatus) => {
    if (status === "CANCELLED" && reason.trim().length < 4) {
      setReasonError("Add a short reason — the client sees a plain-language version of it.");
      return;
    }
    setBusy(true);
    setConflict(null);
    const result = await send<{ message?: string }>(
      "/api/expert/sessions/" + session.id,
      "PATCH",
      { action: "status", status, reason: reason.trim() || undefined }
    );
    setBusy(false);

    if (!result.ok) {
      if (result.status === 409) setConflict(result.error);
      failed("Status not changed", result.error);
      return;
    }

    saved(STATUS_META[status].label + " · " + session.ref, result.data.message);
    setPending(null);
    setReason("");
    setReasonError(null);
    router.refresh();
  };

  if (session.status === "CANCELLED") {
    return (
      <p className="text-[0.84rem] text-ink/60">
        Cancelled sessions are final. If the client wants another slot they book it themselves —
        nothing here to change.
      </p>
    );
  }

  const dialogCopy: Record<string, { title: string; body: string; confirm: string }> = {
    COMPLETED: {
      title: "Mark this session completed?",
      body: "This is what your payout statement is built from, so only mark it once the session has actually taken place.",
      confirm: "Yes, it happened",
    },
    NO_SHOW: {
      title: "Mark this as a no-show?",
      body: "Our team reviews every no-show before the client is charged, and reaches out to them. Give it the full fifteen minutes first.",
      confirm: "Client did not join",
    },
    CANCELLED: {
      title: "Cancel this session?",
      body: "The client is emailed straight away and the slot reopens on your calendar. You cannot undo this.",
      confirm: "Cancel the session",
    },
  };

  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && (
        <p className="text-[0.86rem] leading-relaxed text-ink/70">
          {STATUS_META[session.status].hint}
          {session.status === "CONFIRMED" && (
            <>
              {" "}
              {started
                ? "It started " + humanGap(away) + " — record the outcome when you are done."
                : "It starts " + humanGap(away) + "."}
            </>
          )}
        </p>
      )}

      {conflict && (
        <InlineAlert tone="warning" title="That change was refused">
          <p>{conflict}</p>
        </InlineAlert>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {canRecordOutcome && (
          <>
            <ActionButton size={compact ? "sm" : "md"} onClick={() => setPending("COMPLETED")}>
              Mark completed
            </ActionButton>
            <ActionButton tone="secondary" size={compact ? "sm" : "md"} onClick={() => setPending("NO_SHOW")}>
              No-show
            </ActionButton>
          </>
        )}

        {canCancel && (
          <ActionButton tone="danger" size={compact ? "sm" : "md"} onClick={() => setPending("CANCELLED")}>
            Cancel session
          </ActionButton>
        )}

        {canCorrect && (
          <ActionButton
            tone="secondary"
            size={compact ? "sm" : "md"}
            onClick={() => setPending(session.status === "COMPLETED" ? "NO_SHOW" : "COMPLETED")}
          >
            Correct to {session.status === "COMPLETED" ? "no-show" : "completed"}
          </ActionButton>
        )}

        {session.status === "CONFIRMED" && !started && phase === "later" && (
          <p className="text-[0.82rem] text-ink/55">
            Outcome buttons appear once it starts, at {formatClinicTime(session.time)} on{" "}
            {formatDate(session.date)}.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? dialogCopy[pending].title : ""}
        body={
          <>
            <p>{pending ? dialogCopy[pending].body : ""}</p>
            <p className="text-ink/60">
              {session.ref} · {formatDate(session.date)} at {formatClinicTime(session.time)}
            </p>
            {pending === "CANCELLED" && lateCancel && (
              <p className="font-medium text-haldi-ink">
                This is inside 24 hours. Late cancellations are visible to our clinical team and
                affect your reliability score.
              </p>
            )}
          </>
        }
        confirmLabel={pending ? dialogCopy[pending].confirm : ""}
        tone={pending === "CANCELLED" ? "danger" : "primary"}
        busy={busy}
        onCancel={() => {
          setPending(null);
          setReasonError(null);
        }}
        onConfirm={() => pending && run(pending)}
      >
        {pending === "CANCELLED" && (
          <Field
            label="Reason"
            required
            error={reasonError}
            hint="Kept on the record for our team. The client is told you had to cancel, not the wording you use here."
          >
            {({ id, describedBy, invalid }) => (
              <TextArea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                rows={3}
                maxLength={200}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setReasonError(null);
                }}
                placeholder="Unwell and cannot hold the session safely."
              />
            )}
          </Field>
        )}
      </ConfirmDialog>
    </div>
  );
}
