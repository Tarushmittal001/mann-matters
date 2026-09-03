export type ManuReply = {
  text: string;
  link?: { label: string; href: string; external?: boolean };
};

export const CRISIS_TERMS = [
  "suicid",
  "kill myself",
  "end it",
  "self harm",
  "self-harm",
  "harm myself",
  "hurt myself",
  "want to die",
  "don't want to live",
  "no reason to live",
] as const;

export function crisisReply(input: string): ManuReply | null {
  const normalized = input.toLowerCase();
  if (CRISIS_TERMS.some((term) => normalized.includes(term))) {
    return {
      text: "I'm really glad you said something, and I want you to be safe. Please don't go through this alone — Tele-MANAS (14416) is free, confidential, and answered 24x7. If you're in immediate danger, call 112. You matter.",
      link: { label: "Open crisis support", href: "/crisis?sos=true" },
    };
  }
  if (normalized.includes("emergency") || normalized.includes("crisis")) {
    return {
      text: "If this is urgent, the fastest help is Tele-MANAS at 14416 — free and 24x7. Here's our crisis page with more options.",
      link: { label: "Crisis support", href: "/crisis?sos=true" },
    };
  }
  return null;
}