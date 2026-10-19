import type { ReactNode } from "react";
import ToolGate from "@/components/tools/ToolGate";

export const dynamic = "force-dynamic";

/**
 * Sign-in gate for the mood check-in.
 *
 * The tools are free; this asks for an account, not for payment. A layout
 * rather than a per-page check, so a tool added here later is gated by
 * default instead of by memory.
 */
export default function CheckInLayout({ children }: { children: ReactNode }) {
  return <ToolGate>{children}</ToolGate>;
}
