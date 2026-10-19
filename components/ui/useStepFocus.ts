"use client";

import { useCallback, useRef } from "react";

/**
 * Move focus to a step's heading when the step changes.
 *
 * In a multi-step flow the button someone just pressed disappears with the
 * step it belonged to, and focus falls back to the top of the page: a screen
 * reader says nothing about the new question, and the next Tab starts from the
 * site header. Focusing the new heading announces it and puts the next Tab
 * inside the new step.
 *
 * Usage: `const stepRef = useStepFocus(stepKey)`, then on each step's heading
 * `ref={stepRef} tabIndex={-1} className="step-focus …"`. Nothing moves on the
 * first render — only when `stepKey` changes.
 *
 * It is a callback ref because the steps animate (AnimatePresence
 * mode="wait"): the new heading mounts only after the old step has finished
 * leaving, so focus has to follow the element's arrival, not the state change.
 */
export function useStepFocus(stepKey: unknown, { preventScroll = false } = {}) {
  const last = useRef(stepKey);
  const pending = useRef(false);

  // decided during render, so it is already set when the new heading's ref
  // attaches — even when, without animation, that happens in the same commit
  if (last.current !== stepKey) {
    last.current = stepKey;
    pending.current = true;
  }

  return useCallback(
    (node: HTMLElement | null) => {
      if (node && pending.current) {
        pending.current = false;
        node.focus({ preventScroll });
      }
    },
    [preventScroll]
  );
}
