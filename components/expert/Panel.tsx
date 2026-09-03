import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_META, type SessionStatus } from "@/lib/expert-portal";

/* Presentational shells shared by every page in the portal. No hooks here on
   purpose — these render inside server components. */

export function Panel({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-forest-800/10 bg-ivory-light shadow-lift",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  hint,
  id,
  actions,
  level = 2,
}: {
  title: string;
  hint?: ReactNode;
  id?: string;
  actions?: ReactNode;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-forest-800/10 px-5 py-4 sm:px-6 sm:py-5">
      <div className="min-w-0">
        <Heading
          id={id}
          className={cn(
            "font-display font-medium text-forest-900",
            level === 2 ? "text-xl" : "text-lg"
          )}
        >
          {title}
        </Heading>
        {hint && <p className="mt-1 max-w-prose text-[0.86rem] leading-snug text-ink/65">{hint}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </header>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: SessionStatus;
  className?: string;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.CONFIRMED;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
        meta.tone,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

/** A live/starting-soon marker, separate from status so both can show at once. */
export function LiveChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-kesar/12 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-kesar-ink ring-1 ring-inset ring-kesar/30">
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kesar/70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-kesar" />
      </span>
      {label}
    </span>
  );
}

export function Chip({ children, tone = "sage" }: { children: ReactNode; tone?: "sage" | "quiet" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[0.8rem] font-medium",
        tone === "sage"
          ? "bg-sage-light/60 text-forest-800"
          : "bg-forest-800/[0.05] text-ink/70 ring-1 ring-inset ring-forest-800/10"
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon = "calendar",
}: {
  title: string;
  body: ReactNode;
  action?: ReactNode;
  icon?: "calendar" | "clock" | "lock" | "search" | "check";
}) {
  return (
    <div className="rounded-2xl border border-dashed border-forest-800/20 bg-ivory-light/60 px-6 py-12 text-center">
      <span
        className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-sage-light/50 text-forest-700"
        aria-hidden="true"
      >
        <EmptyIcon name={icon} />
      </span>
      <p className="font-display text-lg font-medium text-forest-900">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-[0.9rem] leading-relaxed text-ink/65">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

function EmptyIcon({ name }: { name: "calendar" | "clock" | "lock" | "search" | "check" }) {
  const stroke = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {name === "calendar" && (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" {...stroke} />
          <path d="M3.5 10h17M8.5 3v4M15.5 3v4" {...stroke} />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...stroke} />
          <path d="M12 7.5V12l3 2" {...stroke} />
        </>
      )}
      {name === "lock" && (
        <>
          <rect x="4.5" y="10.5" width="15" height="10" rx="3" {...stroke} />
          <path d="M8 10.5V8a4 4 0 118 0v2.5" {...stroke} />
        </>
      )}
      {name === "search" && (
        <>
          <circle cx="11" cy="11" r="6.5" {...stroke} />
          <path d="m16 16 4 4" {...stroke} />
        </>
      )}
      {name === "check" && <path d="M5 12.5 10 17.5 19 7" {...stroke} />}
    </svg>
  );
}

export function InlineAlert({
  tone,
  title,
  children,
  action,
}: {
  tone: "warning" | "danger" | "info" | "success";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const tones = {
    warning: "border-haldi/45 bg-haldi/[0.09] text-haldi-ink",
    danger: "border-red-300 bg-red-50 text-red-800",
    info: "border-neel/30 bg-neel/[0.06] text-neel-ink",
    success: "border-mor/35 bg-mor/[0.07] text-mor-ink",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3.5", tones[tone])} role={tone === "danger" ? "alert" : undefined}>
      <p className="text-[0.88rem] font-semibold">{title}</p>
      {children && <div className="mt-1 space-y-1 text-[0.85rem] leading-relaxed text-ink/75">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** label / value pair used across the session detail page. */
export function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-[0.94rem] text-forest-900">{children}</dd>
    </div>
  );
}

export function QuietLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="link-draw text-sm font-medium text-forest-800">
      {children}
    </Link>
  );
}
