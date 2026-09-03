"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BackButton from "@/components/layout/BackButton";
import { navLinks, toolLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type SessionUser = { name: string; email: string; role: "USER" | "EXPERT" | "ADMIN" } | null;
type Item = { href: string; label: string; desc?: string };

const linkBase =
  "link-draw whitespace-nowrap text-[0.9rem] font-medium tracking-wide text-forest-800/75 transition-colors hover:text-forest-900";

/** The "Free tools" dropdown. */
function NavMenu({
  label,
  items,
  eyebrow,
  active,
  open,
  onOpen,
  width = "w-64",
  columns = 1,
}: {
  label: string;
  items: Item[];
  eyebrow: string;
  active: boolean;
  open: boolean;
  onOpen: (v: boolean) => void;
  width?: string;
  columns?: 1 | 2;
}) {
  const panel = useRef<HTMLDivElement>(null);

  /**
   * React registers onWheel passively, so it cannot stop the page taking the
   * scroll instead. A native non-passive listener lets the trackpad scroll the
   * panel itself, and hands the gesture back to the page at either end.
   */
  useEffect(() => {
    const el = panel.current;
    if (!open || !el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollHeight <= el.clientHeight) return;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) {
        e.preventDefault();
        el.scrollTop += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  return (
    <div className="relative" onMouseEnter={() => onOpen(true)} onMouseLeave={() => onOpen(false)}>
      <button
        type="button"
        onClick={() => onOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap text-[0.9rem] font-medium tracking-wide text-forest-800/75 transition-colors hover:text-forest-900",
          active && "text-forest-900"
        )}
      >
        {label}
        <svg
          className={cn("transition-transform duration-300 ease-silk", open && "rotate-180")}
          width="9"
          height="9"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 4.5 6 8.5l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: EASE }}
            className={cn("absolute right-0 top-full z-50 pt-3", width)}
          >
            <div
              ref={panel}
              tabIndex={0}
              className="rail max-h-[min(26rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain rounded-2xl border border-forest-800/10 bg-ivory-light p-2 shadow-bloom"
            >
              <p className="px-3 pb-1 pt-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-forest-600">
                {eyebrow}
              </p>
              <div className={cn(columns === 2 && "grid grid-cols-2 gap-x-1")}>
                {items.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    onClick={() => onOpen(false)}
                    className="flex flex-col rounded-xl px-3 py-2.5 transition-colors hover:bg-sage-light/40"
                  >
                    <span className="text-sm font-semibold text-forest-900">{t.label}</span>
                    {t.desc && <span className="text-xs text-ink/55">{t.desc}</span>}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<"tools" | null>(null);
  // undefined = still loading, null = logged out
  const [user, setUser] = useState<SessionUser | undefined>(undefined);
  const pathname = usePathname();

  // refetch on navigation so the link flips right after login/logout
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => alive && setUser(d.user))
      .catch(() => alive && setUser(null));
    return () => {
      alive = false;
    };
  }, [pathname]);

  const accountLink =
    user === undefined
      ? null
      : user === null
        ? { href: "/login", label: "Log in" }
        : user.role === "ADMIN"
          ? { href: "/admin", label: "Admin" }
          : user.role === "EXPERT"
            ? { href: "/expert", label: "Expert portal" }
            : { href: "/dashboard", label: "My sessions" };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close the mobile menu + dropdowns on navigation, lock scroll while open
  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-silk",
          scrolled
            ? "border-b border-forest-800/10 bg-ivory/80 py-3 backdrop-blur-xl"
            : "bg-transparent py-5"
        )}
      >
        <nav className="wrap-wide flex items-center justify-between gap-6" aria-label="Main">
          <div className="flex shrink-0 items-center gap-3">
            <BackButton />
            <Link href="/" className="group flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-display text-[1.3rem] font-semibold tracking-tight text-forest-900">
                Emoraa
              </span>
              <span
                className="font-deva text-sm text-gold transition-opacity duration-300 group-hover:opacity-100 xl:opacity-60"
                aria-hidden="true"
              >
                मन
              </span>
            </Link>
          </div>

          <div className="hidden items-center gap-5 xl:flex 2xl:gap-7">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(linkBase, pathname.startsWith(l.href) && "text-forest-900")}
              >
                {l.label}
              </Link>
            ))}

            <NavMenu
              label="Free tools"
              eyebrow="free &amp; private"
              items={toolLinks}
              width="w-[34rem]"
              columns={2}
              active={toolLinks.some((t) => pathname.startsWith(t.href))}
              open={menu === "tools"}
              onOpen={(v) => setMenu(v ? "tools" : null)}
            />

            {accountLink && (
              <Link
                href={accountLink.href}
                className={cn(linkBase, pathname.startsWith(accountLink.href) && "text-forest-900")}
              >
                {accountLink.label}
              </Link>
            )}

            <Link
              href="/crisis?sos=true"
              aria-label="SOS — get crisis help now"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-red-600 px-4 py-2 text-[0.82rem] font-bold tracking-wide text-white transition-colors duration-300 hover:bg-red-700"
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              SOS
            </Link>

            <Link
              href="/book"
              className="shrink-0 whitespace-nowrap rounded-full bg-gold px-5 py-2.5 text-[0.86rem] font-semibold text-forest-950 transition-all duration-300 ease-silk hover:bg-gold-dark hover:shadow-lift"
            >
              Book a session
            </Link>
          </div>

          <button
            className="relative z-[70] flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] xl:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <span
              className={cn(
                "h-px w-6 bg-forest-900 transition-all duration-300 ease-silk",
                open && "translate-y-[3px] rotate-45 bg-ivory"
              )}
            />
            <span
              className={cn(
                "h-px w-6 bg-forest-900 transition-all duration-300 ease-silk",
                open && "-translate-y-[3px] -rotate-45 bg-ivory"
              )}
            />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col justify-center overflow-y-auto bg-forest-900 px-8 py-24 xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <p className="eyebrow mb-8 text-sage" aria-hidden="true">
              <span className="font-deva normal-case tracking-normal text-gold">मन</span> · menu
            </p>
            <nav className="flex flex-col gap-2" aria-label="Mobile">
              {[
                { href: "/", label: "Home" },
                ...navLinks,
                ...(accountLink ? [accountLink] : []),
                { href: "/book", label: "Book a session" },
                { href: "/crisis?sos=true", label: "SOS — get help now" },
              ].map((l, i) => (
                <div key={l.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "110%" }}
                    transition={{ duration: 0.55, delay: 0.05 * i, ease: EASE }}
                  >
                    <Link
                      href={l.href}
                      className={cn(
                        "font-display text-[2rem] font-medium leading-[1.4] text-ivory transition-colors hover:text-gold sm:text-4xl",
                        l.href === "/book" && "text-gold",
                        l.href.startsWith("/crisis") && "text-red-400 hover:text-red-300"
                      )}
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                </div>
              ))}
            </nav>

            {/* Free tools — compact group so the menu stays in view */}
            <motion.div
              className="mt-8 border-t border-ivory/10 pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="eyebrow mb-3 text-sage">Free tools</p>
              <div className="flex flex-col gap-2.5">
                {toolLinks.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="font-display text-lg font-medium text-sage-light/90 transition-colors hover:text-gold"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.p
              className="mt-8 text-sm text-sage-light/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              In crisis? Call Tele-MANAS 14416 — free, 24x7.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
