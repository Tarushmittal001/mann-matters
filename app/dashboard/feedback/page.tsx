import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { listFeedbackAvatars } from "@/lib/feedback-avatars";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "Share your story",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/feedback");

  const feedback = await prisma.feedback.findUnique({
    where: { userId: session.sub },
    select: { quote: true, avatar: true, nameStyle: true, detail: true, status: true },
  });

  return (
    <div className="page-top wrap pb-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">
              मन
            </span>
            share your story
          </p>
          <h1 className="h-display text-4xl md:text-5xl">Tell us how it went.</h1>
          <p className="mt-4 max-w-xl text-ink/65">
            A few honest words can be what helps someone else book their first session. Approved
            stories appear under &ldquo;We heard you&rdquo; on our home page.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="link-draw text-sm font-medium text-forest-800">
            My sessions
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-14">
        <FeedbackForm fullName={session.name} initial={feedback} avatars={listFeedbackAvatars()} />
      </div>
    </div>
  );
}
