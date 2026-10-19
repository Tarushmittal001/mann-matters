import type { ReactNode } from "react";
import ToolGate from "@/components/tools/ToolGate";

export const dynamic = "force-dynamic";

/**
 * Sign-in gate for every tool under /tools.
 *
 * The /tools menu itself sits outside this group on purpose: somebody should
 * be able to see what is on offer before being asked to make an account.
 *
 * The tools are free; this asks for an account, not for payment. A layout
 * rather than a per-page check, so a tool added here later is gated by
 * default instead of by memory.
 */
export default function GatedToolsLayout({ children }: { children: ReactNode }) {
  return <ToolGate>{children}</ToolGate>;
}
