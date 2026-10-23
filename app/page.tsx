import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import TalkBar from "@/components/sections/TalkBar";
import Concerns from "@/components/sections/Concerns";
import ManuOnWhatsApp from "@/components/sections/ManuOnWhatsApp";
import HowItWorks from "@/components/sections/HowItWorks";
import WhyEmoraa from "@/components/sections/WhyEmoraa";
import NotSure from "@/components/sections/NotSure";
import Testimonials from "@/components/sections/Testimonials";
import CTABand from "@/components/sections/CTABand";
import { prisma } from "@/lib/db";
import { listExperts } from "@/lib/experts-store";
import { FEEDBACK_STATUS, toTestimonial } from "@/lib/feedback";

// regenerated at most every 10 minutes, and straight away when an admin approves or hides a story
export const revalidate = 600;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: { "en-IN": "/", "hi-IN": "/hi" },
  },
};

/**
 * Approved client stories only, newest first. No invented "sample" stories are
 * mixed in: a made-up review is a fake review, however kindly written. With
 * none approved yet the section simply does not render.
 */
async function loadStories() {
  try {
    const rows = await prisma.feedback.findMany({
      where: { status: FEEDBACK_STATUS.approved },
      include: { user: { select: { name: true } } },
      orderBy: { reviewedAt: "desc" },
      take: 50,
    });
    return rows.map(toTestimonial);
  } catch {
    // the home page must never fail because the database is unreachable
    return [];
  }
}

export default async function HomePage() {
  const [stories, experts] = await Promise.all([loadStories(), listExperts()]);
  return (
    <>
      {/* the promise */}
      <Hero />
      {/* the free way in, straight after the promise */}
      <TalkBar />

      {/* the eight things people arrive with — the doors into the catalogue.
          These used to orbit the brain in the hero; see Concerns.tsx. */}
      <Concerns />

      {/* the objection that stops most people: "is this even for me?" */}
      <NotSure experts={experts} />

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
