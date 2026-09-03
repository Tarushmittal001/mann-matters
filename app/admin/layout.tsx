import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/experts", label: "Experts" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="bg-ivory">
      <div className="wrap-wide flex flex-col gap-8 pb-4 pt-28 lg:flex-row lg:items-center lg:justify-between lg:pt-32">
        <div>
          <p className="eyebrow flex items-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
              मन
            </span>
            operations
          </p>
          <p className="mt-1 text-sm text-ink/55">Single admin workspace</p>
        </div>
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
