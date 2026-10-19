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

const COPY = {
  login: { eyebrow: "welcome back", title: "Good to see you again." },
  signup: { eyebrow: "create your account", title: "Let's get you set up." },
  forgot: { eyebrow: "forgot password", title: "Let's get you back in." },
  reset: { eyebrow: "new password", title: "Choose a new password." },
} as const;

export default function AuthIntro({ mode }: { mode: keyof typeof COPY }) {
  const { eyebrow, title } = COPY[mode];

  return (
    <div className="page-top wrap flex min-h-[70vh] items-center justify-center pb-24">
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
