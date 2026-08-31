import { cn } from "@/lib/utils";

/**
 * Decorative echo of the hero's 3D language — soft blurred spheres
 * that drift slowly. Pure CSS, zero JS cost, hidden from screen readers.
 */
export default function FloatingOrbs({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <span className="absolute left-[8%] top-[18%] h-24 w-24 animate-drift-slow rounded-full bg-gradient-to-br from-sage/50 to-sage/10 blur-xl" />
      <span
        className="absolute right-[10%] top-[55%] h-10 w-10 animate-breathe rounded-full bg-gradient-to-br from-gold/45 to-gold/10 blur-md"
        style={{ animationDelay: "-3s" }}
      />
      <span
        className="absolute bottom-[12%] left-[28%] h-14 w-14 animate-drift-slow rounded-full bg-gradient-to-br from-sage/40 to-transparent blur-lg"
        style={{ animationDelay: "-6s" }}
      />
    </div>
  );
}
