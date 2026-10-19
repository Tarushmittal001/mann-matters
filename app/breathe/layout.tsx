import type { ReactNode } from "react";
import ToolGate from "@/components/tools/ToolGate";

export const dynamic = "force-dynamic";

/**
 * Sign-in gate for the breathing exercise.
 *
 * /crisis embeds BreathingExercise directly as a component, so the crisis
 * page keeps a working breathing exercise with no account. That is what makes
 * gating this route acceptable.
 *
 * The tools are free; this asks for an account, not for payment. A layout
 * rather than a per-page check, so a tool added here later is gated by
 * default instead of by memory.
 */
export default function BreatheLayout({ children }: { children: ReactNode }) {
  return <ToolGate>{children}</ToolGate>;
}
