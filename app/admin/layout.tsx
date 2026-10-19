import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import StaffBar from "@/components/layout/StaffBar";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/experts", label: "Experts" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/revenue", label: "Revenue" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/coupons", label: "Codes" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/audit", label: "Trail" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/dashboard");

  /*
   * Only offer the expert portal to an admin who is also a practitioner.
   *
   * Most admins are not. Sending one to /expert lands them on "your
   * practitioner record isn't linked yet" — a screen written for a therapist
   * waiting on onboarding, telling the operations team to contact the
   * operations team. A link that can only disappoint is worse than no link.
   */
  const alsoPractises = await prisma.expertProfile.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });

  return (
    <div className="min-h-screen bg-ivory">
      <StaffBar
        workspace="Operations"
        name={session.name}
        crossLink={alsoPractises ? { href: "/expert", label: "Expert portal" } : undefined}
      />
      {/* the long top padding is gone with the fixed marketing navbar it used
          to clear — the staff bar is in the flow and takes its own space */}
      {/* The eyebrow that used to sit here said "operations" directly under a
          bar that says OPERATIONS. One of them had to go, and the bar is the
          one that stays put while you move between sections. */}
      <div className="wrap-wide pb-2 pt-7">
        <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto pb-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-full border border-forest-800/15 px-4 py-2 text-sm font-medium text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory",
                "aria-[current=page]:border-forest-800 aria-[current=page]:bg-forest-800 aria-[current=page]:text-ivory"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
