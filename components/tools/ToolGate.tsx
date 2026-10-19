import type { ReactNode } from "react";
import ToolWall from "@/components/tools/ToolWall";
import { getSession } from "@/lib/auth";

/**
 * The gate in front of every free tool.
 *
 * The tools are still free — this asks for an account, never for money.
 *
 * Why it renders a wall instead of calling `redirect()`: a redirect would drop
 * the visitor on /login with no explanation of why they were moved, and with
 * no route to crisis help. ToolWall says both. It also keeps the URL, so the
 * browser's back button and a shared link still behave.
 *
 * Used from a layout rather than from each page, so a tool added later is
 * covered whether or not its author remembers. `getSession()` is where account
 * blocking is enforced, so a blocked account lands on the wall too.
 */
export default async function ToolGate({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) return <ToolWall />;
  return <>{children}</>;
}
