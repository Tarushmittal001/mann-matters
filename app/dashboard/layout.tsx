import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * The gate for everything under /dashboard.
 *
 * Each page already checks, so why here as well: `app/dashboard/loading.tsx`
 * puts the page inside a Suspense boundary, which means its shell starts
 * streaming — status line sent, headers gone — before the page body ever runs.
 * A `redirect()` thrown after that point cannot become a 307, so a signed-out
 * or blocked visitor sat on a skeleton that never resolved instead of being
 * sent to the login screen.
 *
 * A layout renders above that boundary, so the redirect here happens before
 * anything is flushed. It also means a new page added under /dashboard is
 * guarded whether or not its author remembered to check.
 *
 * `getSession()` is where blocking is enforced, so a blocked account lands
 * here too — their cookie still verifies, but the account behind it is closed.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  return <>{children}</>;
}
