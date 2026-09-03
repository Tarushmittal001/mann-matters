"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MAX_NOTE,
  NOTES_POLICY_COPY,
  canWriteNotes,
  isNotesPolicy,
  sessionMinutesAway,
} from "@/lib/expert-portal";
import type { ExpertNoteView } from "@/lib/expert-data";
import { ActionButton, ConfirmDialog, Field, TextArea } from "@/components/expert/controls";
import { EmptyState, InlineAlert } from "@/components/expert/Panel";
import { send, stampNow } from "@/components/expert/request";
import { useToast } from "@/components/expert/Toast";
import { useNow } from "@/components/expert/useNow";

/**
 * The notes workflow, gated on policy at every level.
 *
 * When `notesPolicy` is not APPROVED there is no textarea to type into — an
 * input that discards what you write is worse than no input. When it is
 * approved, a note runs draft → submitted → amended, and submitting is
 * deliberately one-way: a clinical record you can quietly rewrite is not a
 * record. Corrections are appended, dated, and never overwrite the original.
 */
export default function SessionNotes({
  sessionId,
  date,
  time,
  status,
  policy,
  policyNote,
  note,
  serverNow,
}: {
  sessionId: string;
  date: string;
  time: string;
  status: string;
  policy: string;
  policyNote: string;
  note: ExpertNoteView | null;
  serverNow: string;
}) {
  const router = useRouter();
  const { saved, failed } = useToast();
  const now = useNow(serverNow, 60_000);

  const [draft, setDraft] = useState(note?.body ?? "");
  const [amendment, setAmendment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "submit" | "amend" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  /* ── policy gate ───────────────────────────────────────────────────────── */
  if (!canWriteNotes(policy)) {
    const copy = NOTES_POLICY_COPY[isNotesPolicy(policy) ? policy : "PENDING"];
    return (
      <div className="p-5 sm:p-6">
        <EmptyState icon="lock" title={copy.label} body={copy.body} />
        {policyNote && (
          <p className="mx-auto mt-4 max-w-md text-center text-[0.82rem] text-ink/55">{policyNote}</p>
        )}
      </div>
    );
  }

  /* ── timing and status gates ───────────────────────────────────────────── */
  if (status === "CANCELLED") {
    return (
      <div className="p-5 sm:p-6">
        <EmptyState
          icon="lock"
          title="No clinical record for a cancelled session"
          body="Nothing took place, so there is nothing to write up. If you did speak to the client, our clinical team logs that separately."
        />
      </div>
    );
  }

  if (sessionMinutesAway({ date, time, status }, now) > 0) {
    return (
      <div className="p-5 sm:p-6">
        <EmptyState
          icon="clock"
          title="Notes open when the session starts"
          body="Writing a session up before it happens is how details from the wrong conversation end up in a record. The field appears here the moment the session begins."
        />
      </div>
    );
  }

  const submitted = note?.status === "SUBMITTED";
  const dirty = !submitted && draft !== (note?.body ?? "");
  const remaining = MAX_NOTE - draft.length;

  const saveDraft = async () => {
    setBusy("save");
    const result = await send<{ message?: string }>(
      "/api/expert/sessions/" + sessionId + "/note",
      "PUT",
      { body: draft }
    );
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      failed("Draft not saved", result.error);
      return;
    }
    setError(null);
    setSavedAt(stampNow());
    saved("Draft saved", result.data.message);
    router.refresh();
  };

  const submit = async () => {
    setBusy("submit");
    const result = await send<{ message?: string }>(
      "/api/expert/sessions/" + sessionId + "/note",
      "POST",
      { action: "submit", body: draft }
    );
    setBusy(null);
    setConfirming(false);
    if (!result.ok) {
      setError(result.error);
      failed("Note not submitted", result.error);
      return;
    }
    setError(null);
    saved("Note submitted", result.data.message);
    router.refresh();
  };

  const addAmendment = async () => {
    setBusy("amend");
    const result = await send<{ message?: string }>(
      "/api/expert/sessions/" + sessionId + "/note",
      "POST",
      { action: "amend", body: amendment }
    );
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      failed("Amendment not added", result.error);
      return;
    }
    setError(null);
    setAmendment("");
    saved("Amendment added", result.data.message);
    router.refresh();
  };

  const stamp = (iso: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));

  /* ── submitted: read-only, plus amendments ─────────────────────────────── */
  if (submitted && note) {
    return (
      <div className="space-y-5 p-5 sm:p-6">
        <InlineAlert tone="success" title="Submitted and locked">
          <p>
            Filed {note.submittedAt ? stamp(note.submittedAt) : "—"}. Visible to you and to clinical
            governance. Never visible to the client.
          </p>
        </InlineAlert>

        <div className="rounded-xl border border-forest-800/10 bg-ivory px-4 py-4">
          <p className="whitespace-pre-wrap text-[0.92rem] leading-relaxed text-ink/85">{note.body}</p>
        </div>

        {note.amendments.length > 0 && (
          <ol className="space-y-3">
            {note.amendments.map((a, i) => (
              <li
                key={a.id}
                className="rounded-xl border border-forest-800/10 bg-forest-800/[0.03] px-4 py-3.5"
              >
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink/50">
                  Amendment {i + 1} · {stamp(a.createdAt)}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-ink/80">
                  {a.body}
                </p>
              </li>
            ))}
          </ol>
        )}

        <Field
          label="Add an amendment"
          hint="The original stays exactly as filed. Amendments are appended with their own timestamp."
          error={error}
          counter={amendment.length + " / " + MAX_NOTE}
        >
          {({ id, describedBy, invalid }) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              rows={4}
              maxLength={MAX_NOTE}
              value={amendment}
              onChange={(e) => {
                setAmendment(e.target.value);
                setError(null);
              }}
              placeholder="Correction or addition to the note above…"
            />
          )}
        </Field>

        <ActionButton onClick={addAmendment} busy={busy === "amend"} disabled={amendment.trim().length === 0}>
          Add amendment
        </ActionButton>
      </div>
    );
  }

  /* ── draft ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <p className="text-[0.86rem] leading-relaxed text-ink/70">
        {NOTES_POLICY_COPY.APPROVED.body}
      </p>

      <Field
        label="Session note"
        required
        error={error}
        counter={remaining < 200 ? remaining + " left" : draft.length + " / " + MAX_NOTE}
        hint="Presentation, what you worked on, what you agreed next. Keep it clinical — this is a record, not a transcript."
      >
        {({ id, describedBy, invalid }) => (
          <TextArea
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            rows={10}
            maxLength={MAX_NOTE}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            placeholder="Presenting concern, session focus, interventions used, agreed next steps…"
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <ActionButton tone="secondary" onClick={saveDraft} busy={busy === "save"} disabled={!dirty}>
          Save draft
        </ActionButton>
        <ActionButton
          onClick={() => setConfirming(true)}
          disabled={draft.trim().length === 0}
        >
          Submit note
        </ActionButton>
        <p className="text-[0.82rem] text-ink/55" aria-live="polite">
          {dirty
            ? "Unsaved changes"
            : savedAt
              ? "Draft saved at " + savedAt
              : note
                ? "Draft last saved " + stamp(note.updatedAt)
                : "Nothing saved yet"}
        </p>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Submit this note?"
        body={
          <>
            <p>
              Submitting files the note against this session and locks it. From then on you can add
              dated amendments, but the text above cannot be edited or deleted.
            </p>
            <p className="text-ink/60">
              This is what makes it a clinical record rather than a working draft.
            </p>
          </>
        }
        confirmLabel="Submit and lock"
        cancelLabel="Keep editing"
        busy={busy === "submit"}
        onCancel={() => setConfirming(false)}
        onConfirm={submit}
      />
    </div>
  );
}
