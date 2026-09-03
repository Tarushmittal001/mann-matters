"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { humanGap } from "@/lib/clinic-time";
import {
  JOIN_OPENS_MINUTES_BEFORE,
  meetingAccess,
  meetingHostLabel,
  validateMeetingUrl,
} from "@/lib/expert-portal";
import { cn } from "@/lib/utils";
import { ActionButton, CopyButton, Field, TextInput } from "@/components/expert/controls";
import { InlineAlert } from "@/components/expert/Panel";
import { send } from "@/components/expert/request";
import { useToast } from "@/components/expert/Toast";
import { useNow } from "@/components/expert/useNow";

/**
 * Meeting-link access.
 *
 * The practitioner owns the room and can always see and edit the link they
 * pasted. What is gated is *joining*: the door opens fifteen minutes before the
 * hour and closes half an hour after the session should have ended, and the
 * client sees the link on exactly the same schedule. Saying so on screen is the
 * point — a link that quietly stops working is worse than one that explains
 * itself.
 */
export default function MeetingRoom({
  sessionId,
  date,
  time,
  status,
  meetingUrl,
  sessionMinutes,
  serverNow,
  variant = "full",
}: {
  sessionId: string;
  date: string;
  time: string;
  status: string;
  meetingUrl: string | null;
  sessionMinutes: number;
  serverNow: string;
  variant?: "full" | "compact";
}) {
  const router = useRouter();
  const { saved, failed } = useToast();
  const now = useNow(serverNow, 20_000);

  const [draft, setDraft] = useState(meetingUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "remove" | null>(null);

  const access = meetingAccess({ date, time, status, meetingUrl }, sessionMinutes, now);
  const dirty = draft.trim() !== (meetingUrl ?? "");

  const save = async () => {
    const checked = validateMeetingUrl(draft);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setBusy("save");
    const result = await send<{ message?: string }>(
      "/api/expert/sessions/" + sessionId,
      "PATCH",
      { action: "meeting-link", url: checked.url }
    );
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      failed("Link not saved", result.error);
      return;
    }
    setError(null);
    setDraft(checked.url);
    saved("Meeting room saved", result.data.message);
    router.refresh();
  };

  const remove = async () => {
    setBusy("remove");
    const result = await send<{ message?: string }>(
      "/api/expert/sessions/" + sessionId,
      "PATCH",
      { action: "meeting-link", url: null }
    );
    setBusy(null);
    if (!result.ok) {
      failed("Link not removed", result.error);
      return;
    }
    setDraft("");
    setError(null);
    saved("Meeting room removed", result.data.message);
    router.refresh();
  };

  /* ── the compact form, used on the day's cards ──────────────────────────── */
  if (variant === "compact") {
    if (access.state === "open") {
      return (
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={access.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-sunrise bg-[length:200%_100%] bg-left px-5 py-2.5 text-[0.88rem] font-semibold text-forest-950 shadow-kesar transition-[background-position] duration-500 ease-silk hover:bg-right"
          >
            Join session
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3h7v7M13 3 4 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <CopyButton value={access.url} />
          <span className="text-[0.78rem] text-ink/55">
            Room closes {humanGap(access.closesInMinutes)}
          </span>
        </div>
      );
    }

    if (access.state === "early") {
      return (
        <p className="text-[0.84rem] text-ink/60">
          {meetingUrl ? (
            <>
              Room ready on {meetingHostLabel(meetingUrl)}. The join button opens{" "}
              {humanGap(access.opensInMinutes)}, for both of you.
            </>
          ) : (
            <>
              No room yet.{" "}
              <Link href={"/expert/sessions/" + sessionId} className="link-draw font-medium text-forest-800">
                Add the link
              </Link>{" "}
              before it starts.
            </>
          )}
        </p>
      );
    }

    if (access.state === "missing") {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-50 px-3 py-1 text-[0.78rem] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
            No meeting link
          </span>
          <Link
            href={"/expert/sessions/" + sessionId}
            className="link-draw text-[0.84rem] font-semibold text-forest-800"
          >
            Add one now
          </Link>
        </div>
      );
    }

    return (
      <p className="text-[0.84rem] text-ink/55">
        {access.state === "closed" ? "The room for this session has closed." : access.reason}
      </p>
    );
  }

  /* ── the full editor on the session page ───────────────────────────────── */
  return (
    <div className="space-y-5">
      <div
        className={cn(
          "rounded-xl border px-4 py-4",
          access.state === "open"
            ? "border-mor/35 bg-mor/[0.06]"
            : access.state === "missing"
              ? "border-red-200 bg-red-50/60"
              : "border-forest-800/12 bg-forest-800/[0.03]"
        )}
      >
        {access.state === "open" && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.9rem] font-semibold text-forest-900">The room is open</p>
              <p className="mt-0.5 text-[0.83rem] text-ink/65">
                Closes {humanGap(access.closesInMinutes)}. Your client sees the same button.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={access.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 text-[0.88rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
              >
                Join session
              </a>
              <CopyButton value={access.url} />
            </div>
          </div>
        )}

        {access.state === "early" && (
          <>
            <p className="text-[0.9rem] font-semibold text-forest-900">
              Join opens {humanGap(access.opensInMinutes)}
            </p>
            <p className="mt-0.5 text-[0.83rem] leading-relaxed text-ink/65">
              Both of you get the room {JOIN_OPENS_MINUTES_BEFORE} minutes before the session. Until
              then the client sees the date and time only — not the link.
            </p>
          </>
        )}

        {access.state === "missing" && (
          <>
            <p className="text-[0.9rem] font-semibold text-red-800">This session has no room yet</p>
            <p className="mt-0.5 text-[0.83rem] leading-relaxed text-red-900/80">
              Paste a link below. Without one the client has nowhere to join, and they will not be
              able to reach you.
            </p>
          </>
        )}

        {access.state === "closed" && (
          <>
            <p className="text-[0.9rem] font-semibold text-forest-900">The room has closed</p>
            <p className="mt-0.5 text-[0.83rem] text-ink/65">
              Rooms close 30 minutes after a session ends. The link stays here for your records.
            </p>
          </>
        )}

        {access.state === "unavailable" && (
          <p className="text-[0.86rem] text-ink/70">{access.reason}</p>
        )}
      </div>

      <Field
        label="Meeting link"
        required
        error={error}
        hint="Google Meet, Zoom, Teams, Whereby or Jitsi. It must be https, and we never post it anywhere public."
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://meet.google.com/abc-defg-hij"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            disabled={status === "CANCELLED"}
          />
        )}
      </Field>

      {status === "CANCELLED" ? (
        <InlineAlert tone="info" title="Locked">
          <p>This session was cancelled, so its room can no longer be changed.</p>
        </InlineAlert>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton onClick={save} busy={busy === "save"} disabled={!dirty}>
            {meetingUrl ? "Update link" : "Save link"}
          </ActionButton>
          {meetingUrl && (
            <ActionButton tone="ghost" onClick={remove} busy={busy === "remove"}>
              Remove link
            </ActionButton>
          )}
          {!dirty && meetingUrl && (
            <span className="text-[0.82rem] text-ink/55">
              Saved · {meetingHostLabel(meetingUrl)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
