import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import TheProblem from "@/components/sections/TheProblem";
import ManuOnWhatsApp from "@/components/sections/ManuOnWhatsApp";
import PhraseTicker from "@/components/sections/PhraseTicker";
import CulturalIntelligence from "@/components/sections/CulturalIntelligence";
import HowItWorks from "@/components/sections/HowItWorks";
import ToolsSection from "@/components/sections/ToolsSection";
import WhyEmoraa from "@/components/sections/WhyEmoraa";
import Testimonials from "@/components/sections/Testimonials";
import BlogTeaser from "@/components/sections/BlogTeaser";
import CTABand from "@/components/sections/CTABand";

export default function HomePage() {
  return (
    <>
      {/* the promise */}
      <Hero />
      <TrustStrip />

      {/* why this exists, and the answer to it */}
      <TheProblem />
      <ManuOnWhatsApp />

      {/* the human context Manu is built on */}
      <PhraseTicker />
      <CulturalIntelligence />

      {/* ways in */}
      <HowItWorks />
      <ToolsSection />

      {/* reassurance */}
      <WhyEmoraa />
      <Testimonials />
      <BlogTeaser />
      <CTABand />
    </>
  );
}
