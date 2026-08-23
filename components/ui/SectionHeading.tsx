import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

export default function SectionHeading({
  eyebrow,
  deva,
  title,
  description,
  align = "left",
  dark = false,
}: {
  eyebrow: string;
  deva?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        "mb-10 max-w-2xl md:mb-14",
        align === "center" && "mx-auto text-center"
      )}
    >
      <p
        className={cn(
          "eyebrow mb-4 flex items-center gap-3",
          align === "center" && "justify-center",
          dark && "text-sage"
        )}
      >
        {deva && (
          <span
            className="font-deva text-sm normal-case tracking-normal text-kesar"
            aria-hidden="true"
          >
            {deva}
          </span>
        )}
        {eyebrow}
      </p>
      <h2
        className={cn(
          "h-display text-4xl md:text-5xl lg:text-[3.4rem]",
          dark && "text-ivory"
        )}
      >
        {title}
      </h2>
      <span
        className={cn("rule-spectrum mt-5 w-20", align === "center" && "mx-auto")}
        aria-hidden="true"
      />
      {description && (
        <p className={cn("mt-6 text-lg leading-relaxed", dark ? "text-sage-light/80" : "text-ink/70")}>
          {description}
        </p>
      )}
    </Reveal>
  );
}
