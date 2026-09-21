"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BackButton from "@/components/layout/BackButton";
import { moreNav, primaryNav, toolLinks } from "@/lib/site";
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

/** A collapsible group in the mobile menu: a heading, a count, and its links. */
function MobileGroup({
  label,
  count,
  items,
  open,
  onToggle,
  delay,
}: {
  label: string;
  count: number;
  items: Item[];
  open: boolean;
  onToggle: () => void;
  delay: number;
}) {
  return (
    <motion.div
      className="border-t border-ivory/10 first-of-type:mt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: EASE }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-display text-[1.35rem] font-medium text-ivory sm:text-2xl">
          {label}
          <span className="ml-2 align-middle text-[0.8rem] font-sans font-medium text-sage-light/50">
            {count}
          </span>
        </span>
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full border border-ivory/20 text-ivory transition-transform duration-300 ease-silk",
            open && "rotate-180 border-gold bg-gold/15 text-gold"
          )}
          aria-hidden="true"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4.5 6 8.5l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="grid gap-x-6 gap-y-3 pb-5 sm:grid-cols-2">
              {items.map((t) => (
                <Link key={t.href} href={t.href} className="group/item block">
                  <span className="font-display text-lg font-medium text-sage-light/90 transition-colors group-hover/item:text-gold">
                    {t.label}
                  </span>
                  {t.desc && (
                    <span className="mt-0.5 block text-[0.8rem] leading-snug text-sage-light/55">
                      {t.desc}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<"tools" | "more" | null>(null);
  // which group is expanded inside the mobile menu
  const [drawer, setDrawer] = useState<"tools" | "more" | null>(null);
  // undefined = still loading, null = logged out
  const [user, setUser] = useState<SessionUser | undefined>(undefined);
  const pathname = usePathname();
  const menuPanel = useRef<HTMLDivElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);

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
        ? { href: "/login", label: "Sign in" }
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
    setDrawer(null);
  }, [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  /**
   * The mobile menu covers the whole viewport, so it owes the keyboard what any
   * modal owes it: Escape closes it, focus moves inside when it opens and
   * returns to the button that opened it, and Tab cycles within it instead of
   * wandering off into the page hidden underneath. The toggle joins the cycle
   * deliberately — it sits above the overlay and is the close button.
   */
  useEffect(() => {
    if (!open) return;
    const panel = menuPanel.current;
    panel?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuToggle.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const stops = [
        ...Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ),
        menuToggle.current,
      ].filter((el): el is HTMLElement => !!el);
      if (!stops.length) return;

      const first = stops[0];
      const last = stops[stops.length - 1];
      // focus starts on the panel itself; shift-tabbing from there would step
      // backwards out of the overlay into the page it covers
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[70] transition duration-500 ease-silk",
          open
            ? "bg-forest-900 py-3"
            : scrolled
            ? // the frosted bar re-blurs whatever scrolls beneath it, every frame;
              // phones get a solid bar instead, which looks the same in motion
              "border-b border-forest-800/10 bg-ivory/95 py-3 lg:bg-ivory/80 lg:backdrop-blur-xl"
            : "bg-transparent py-5"
        )}
      >
        <nav className="wrap-wide flex items-center justify-between gap-6" aria-label="Main">
          <div className="flex shrink-0 items-center gap-3">
            {!open && <BackButton />}
            <Link href="/" className="flex items-center" aria-label="Emoraa home">
              {/* the brand wordmark; white on the dark open menu, as the old text was */}
              <Image
                src="/brand/emoraa-wordmark.png"
                alt="Emoraa"
                width={1200}
                height={204}
                priority
                className={cn("h-6 w-auto md:h-7", open && "brightness-0 invert")}
              />
            </Link>
          </div>

          {/* four things, not seven: what we do, who else we do it for, what is
              free to try, and a drawer for everything read-once */}
          <div className="hidden items-center gap-5 lg:flex 2xl:gap-7">
            {primaryNav.map((l) => (
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

            <NavMenu
              label="More"
              eyebrow="about emoraa"
              items={moreNav}
              width="w-[19rem]"
              active={moreNav.some((l) => pathname.startsWith(l.href))}
              open={menu === "more"}
              onOpen={(v) => setMenu(v ? "more" : null)}
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
              className="shrink-0 whitespace-nowrap rounded-full bg-gold px-5 py-2.5 text-[0.86rem] font-semibold text-forest-950 transition duration-300 ease-silk hover:bg-gold-dark hover:shadow-lift"
            >
              Book a session
            </Link>
          </div>

          <button
            ref={menuToggle}
            className="relative z-[70] flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <span
              className={cn(
                "h-px w-6 bg-forest-900 transition duration-300 ease-silk",
                open && "translate-y-[3px] rotate-45 bg-ivory"
              )}
            />
            <span
              className={cn(
                "h-px w-6 bg-forest-900 transition duration-300 ease-silk",
                open && "-translate-y-[3px] -rotate-45 bg-ivory"
              )}
            />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuPanel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto overscroll-contain bg-forest-900 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24 focus:outline-none sm:px-8 sm:pt-28 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <p className="eyebrow mb-6 text-sage" aria-hidden="true">
              <span className="font-deva normal-case tracking-normal text-gold">मन</span> · menu
            </p>
            <nav className="flex flex-col" aria-label="Mobile">
              {/* the big three: what most people opened the menu for */}
              {[{ href: "/", label: "Home" }, ...primaryNav].map((l, i) => (
                <div key={l.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "110%" }}
                    transition={{ duration: 0.5, delay: 0.04 * i, ease: EASE }}
                  >
                    <Link
                      href={l.href}
                      className="block py-1.5 font-display text-[1.75rem] font-medium leading-[1.35] text-ivory transition-colors hover:text-gold sm:text-4xl"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                </div>
              ))}

              {/* two drawers, so eleven tools and five pages don't fill the screen */}
              <MobileGroup
                label="Free tools"
                count={toolLinks.length}
                items={toolLinks}
                open={drawer === "tools"}
                onToggle={() => setDrawer(drawer === "tools" ? null : "tools")}
                delay={0.16}
              />
              <MobileGroup
                label="More"
                count={moreNav.length}
                items={moreNav}
                open={drawer === "more"}
                onToggle={() => setDrawer(drawer === "more" ? null : "more")}
                delay={0.2}
              />
            </nav>

            {/* what someone is here to do, kept together at the bottom where a
                thumb can reach it */}
            <motion.div
              className="mt-auto pt-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.45, ease: EASE }}
            >
              {accountLink && (
                <Link
                  href={accountLink.href}
                  className="mb-4 inline-flex items-center gap-2 text-[0.95rem] font-medium text-sage-light/85 transition-colors hover:text-ivory"
                >
                  {accountLink.label}
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )}
              <div className="flex items-center gap-3">
                <Link
                  href="/book"
                  className="press flex-1 rounded-full bg-gold px-6 py-3.5 text-center text-[0.95rem] font-semibold text-forest-950"
                >
                  Book a session
                </Link>
                <Link
                  href="/crisis?sos=true"
                  aria-label="SOS — get crisis help now"
                  className="press flex items-center gap-2 rounded-full bg-red-600 px-5 py-3.5 text-[0.9rem] font-bold text-white"
                >
                  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  SOS
                </Link>
              </div>
            </motion.div>

            <motion.p
              className="mt-6 text-sm text-sage-light/60"
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
