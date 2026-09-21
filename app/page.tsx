import Hero from "@/components/sections/Hero";
import TalkBar from "@/components/sections/TalkBar";
import TrustStrip from "@/components/sections/TrustStrip";
import ManuOnWhatsApp from "@/components/sections/ManuOnWhatsApp";
import HowItWorks from "@/components/sections/HowItWorks";
import WhyEmoraa from "@/components/sections/WhyEmoraa";
import Testimonials from "@/components/sections/Testimonials";
import CTABand from "@/components/sections/CTABand";
import { prisma } from "@/lib/db";
import { FEEDBACK_STATUS, toTestimonial } from "@/lib/feedback";
import { testimonials as sampleStories } from "@/lib/testimonials";

// regenerated at most every 10 minutes, and straight away when an admin approves or hides a story
export const revalidate = 600;

/** Approved client stories first (newest first), then the sample stories. */
async function loadStories() {
  try {
    const rows = await prisma.feedback.findMany({
      where: { status: FEEDBACK_STATUS.approved },
      include: { user: { select: { name: true } } },
      orderBy: { reviewedAt: "desc" },
      take: 50,
    });
    return [...rows.map(toTestimonial), ...sampleStories];
  } catch {
    // the home page must never fail because the database is unreachable
    return sampleStories;
  }
}

export default async function HomePage() {
  const stories = await loadStories();
  return (
    <>
      {/* the promise */}
      <Hero />
      {/* the free way in, straight after the promise */}
      <TalkBar />
      <TrustStrip />

      {/* the companion, on WhatsApp */}
      <ManuOnWhatsApp />

      <HowItWorks />

      {/* reassurance: why us, then the people it helped, right before the ask */}
      <WhyEmoraa />
      <Testimonials stories={stories} />
      <CTABand />
    </>
  );
}
