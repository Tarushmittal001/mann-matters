import { site } from "@/lib/site";

/**
 * The WhatsApp call-to-action, framed as a person rather than a channel.
 *
 * "Talk to us on WhatsApp" asked you to pick a medium. This asks you to talk to
 * Manu — and answers the two questions that actually decide whether someone
 * taps: is anyone there, and will it cost me. The live dot says the first; the
 * sub-label says the second.
 *
 * The WhatsApp mark keeps its own green (#25D366) rather than being recoloured
 * into the brand palette — recognition is the whole job of that glyph, and a
 * forest-green WhatsApp logo reads as a generic chat bubble.
 */
export default function TalkToManuButton({
  className = "",
  label = "Talk to Manu",
  note = "free · any hour · on WhatsApp",
}: {
  className?: string;
  label?: string;
  note?: string;
}) {
  return (
    <a
      href={site.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} — ${note.replace(/·/g, ",")}`}
      className={`group inline-flex items-center gap-3 rounded-full border border-forest-800/25 bg-ivory-light/70 py-2 pl-2 pr-6 transition-all duration-300 ease-silk hover:-translate-y-0.5 hover:border-forest-800 hover:bg-forest-800 hover:shadow-bloom ${className}`}
    >
      <span className="relative shrink-0">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] shadow-lift transition-transform duration-300 ease-silk group-hover:scale-105">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
        </span>
        {/* presence: the reason someone taps a chat button at 2 a.m. */}
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-green-400 ring-2 ring-ivory-light transition-colors duration-300 group-hover:ring-forest-800" />
        </span>
      </span>

      <span className="flex flex-col text-left leading-tight">
        <span className="text-[0.95rem] font-semibold tracking-wide text-forest-800 transition-colors duration-300 group-hover:text-ivory">
          {label}
        </span>
        <span className="mt-0.5 text-[0.72rem] text-ink/50 transition-colors duration-300 group-hover:text-ivory/70">
          {note}
        </span>
      </span>
    </a>
  );
}
