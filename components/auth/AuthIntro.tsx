import type { Locale } from "@/lib/i18n";
import { authCopy, type AuthCopy } from "@/lib/i18n/auth";

/**
 * The heading of an auth page, rendered on the server.
 *
 * `AuthForm` reads the `?next=` parameter, so it sits behind a Suspense
 * boundary — and Next drops that whole subtree from the server-rendered HTML.
 * The result was a sign-up page whose first byte contained no heading at all:
 * nothing for a crawler to read, and a blank rectangle for anyone on a slow
 * phone until the JavaScript arrived.
 *
 * This is that boundary's fallback. It carries the same eyebrow and the same
 * <h1> the form itself renders, so the page has its heading from the first
 * byte and the swap when the form hydrates is invisible.
 */

// A server component, so it cannot read the URL the way `useLocale` does: the
// Hindi pages say which language they are in. The words are the same ones
// AuthForm draws, from the same file, so the swap stays invisible in Hindi too.
export default function AuthIntro({
  mode,
  locale = "en",
}: {
  mode: keyof AuthCopy["intro"];
  locale?: Locale;
}) {
  const { eyebrow, title } = authCopy(locale).intro[mode];

  return (
    <div lang={locale} className="page-top wrap flex min-h-[70vh] items-center justify-center pb-24">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span
            className="font-deva text-sm normal-case tracking-normal text-gold"
            aria-hidden="true"
          >
            मन
          </span>
          {eyebrow}
        </p>
        <h1 className="h-display text-4xl">{title}</h1>
        {/* the form takes this space the moment it hydrates */}
        <div className="mt-10 h-64 animate-pulse rounded-2xl bg-forest-800/[0.04]" aria-hidden="true" />
      </div>
    </div>
  );
}
