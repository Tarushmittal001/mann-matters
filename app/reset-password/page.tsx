import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import { CrisisLine } from "@/components/ui/Feedback";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { resetTokenOwner } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; welcome?: string };
}) {
  const token = searchParams.token?.trim() ?? "";
  /* An invited practitioner arrives here having never had a password, so
     "choose a NEW password" and "reset links expire after an hour" are both
     wrong for them. Same screen, same token, different words. */
  const welcome = searchParams.welcome === "1";
  // checked here so a dead link says so immediately, instead of after typing a password
  const user = token ? await resetTokenOwner(token) : null;

  if (!user) {
    return (
      <div className="page-top wrap flex min-h-[70vh] items-center justify-center pb-24">
        <div className="w-full max-w-md">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
              मन
            </span>
            new password
          </p>
          <h1 className="h-display text-4xl">This link doesn&apos;t work any more.</h1>
          <p className="mt-4 leading-relaxed text-ink/70">
            {welcome
              ? "Invite links can be used once, and this one has been used or has run out. Ask your admin to send a fresh one."
              : "Reset links can be used once and expire after an hour. Ask for a fresh one and you'll be back in shortly."}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button href="/forgot-password" variant="forest">
              Send me a new link
            </Button>
            <Button href="/login" variant="outline">
              Back to sign in
            </Button>
          </div>
          <CrisisLine className="mt-10" />
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token} name={user.name} welcome={welcome} />;
}
