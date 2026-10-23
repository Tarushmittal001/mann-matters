import type { ReactNode } from "react";
import ToolGate from "@/components/tools/ToolGate";

export const dynamic = "force-dynamic";

/**
 * Sign-in gate for the tools in this group.
 *
 * The /tools menu itself sits outside this group on purpose: somebody should
 * be able to see what is on offer before being asked to make an account.
 *
 * The calming tools — /breathe, /tools/grounding and /tools/relax — are
 * deliberately outside it too. They are what a distressed person comes for,
 * and a signup form with a phone code is no thing to put in front of them.
 * PRODUCT.md, principle 3. Anything that keeps what someone writes or tracks
 * (journal, check-ins) stays here.
 *
 * The tools are free; this asks for an account, not for payment. A layout
 * rather than a per-page check, so a tool added here later is gated by
 * default instead of by memory.
 */
export default function GatedToolsLayout({ children }: { children: ReactNode }) {
  return <ToolGate>{children}</ToolGate>;
}
