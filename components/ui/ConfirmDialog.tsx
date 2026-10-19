"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Portal from "@/components/ui/Portal";

/**
 * "Are you sure?", in the site's own voice.
 *
 * Replaces `window.confirm()`, which the browser draws in its own grey box:
 * it cannot be styled or translated, reads like a system error in the middle
 * of a calm screen, and some in-app browsers suppress it altogether.
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (!(await confirm({ title: "Delete this code?", confirmLabel: "Delete", danger: true }))) return;
 *   …and render {confirmDialog} somewhere in the component.
 *
 * Focus starts on Cancel — the safe choice — Escape cancels, Tab stays inside,
 * and focus goes back to what was focused before it opened.
 */
export type ConfirmOptions = {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** The action destroys or removes something: the confirm button says so in red. */
  danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    []
  );

  const dialog = pending ? (
    <ConfirmDialog
      {...pending}
      onClose={(ok) => {
        pending.resolve(ok);
        setPending(null);
      }}
    />
  ) : null;

  return [confirm, dialog] as const;
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  onClose,
}: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => returnTo?.focus?.();
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose(false);
    }
    // two buttons: Tab and Shift+Tab simply swap between them
    if (e.key === "Tab") {
      e.preventDefault();
      (document.activeElement === cancelRef.current ? confirmRef : cancelRef).current?.focus();
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6" onKeyDown={onKeyDown}>
        <div className="absolute inset-0 bg-forest-950/45 backdrop-blur-sm" onClick={() => onClose(false)} aria-hidden="true" />
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={body ? bodyId : undefined}
          className="relative w-full max-w-md rounded-t-3xl bg-ivory-light p-6 shadow-bloom sm:rounded-3xl sm:p-8"
        >
          <h2 id={titleId} className="font-display text-xl font-medium text-forest-900">
            {title}
          </h2>
          {body && (
            <div id={bodyId} className="mt-2 text-[0.92rem] leading-relaxed text-ink/70">
              {body}
            </div>
          )}
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => onClose(false)}
              className="press rounded-full border border-forest-800/20 px-5 py-2.5 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-800"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={() => onClose(true)}
              className={
                danger
                  ? "press rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-red-800"
                  : "press rounded-full bg-forest-800 px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-700"
              }
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
