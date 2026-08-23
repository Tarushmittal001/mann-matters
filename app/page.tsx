import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import TheProblem from "@/components/sections/TheProblem";
import ManuOnWhatsApp from "@/components/sections/ManuOnWhatsApp";
import PhraseTicker from "@/components/sections/PhraseTicker";
import CulturalIntelligence from "@/components/sections/CulturalIntelligence";
import MomentsMosaic from "@/components/sections/MomentsMosaic";
import HowItWorks from "@/components/sections/HowItWorks";
import ToolsSection from "@/components/sections/ToolsSection";
import WhyMannMatters from "@/components/sections/WhyMannMatters";
import Testimonials from "@/components/sections/Testimonials";
import BlogTeaser from "@/components/sections/BlogTeaser";
import CTABand from "@/components/sections/CTABand";
import WaveDivider from "@/components/ui/WaveDivider";

export default function HomePage() {
  return (
    <>
      {/* the promise */}
      <Hero />
      <TrustStrip />

      {/* why this exists, and the answer to it */}
      <TheProblem />
      <ManuOnWhatsApp />

      {/* back up into the light — the seam gets drawn rather than cut.
          The wrapper carries the colour above, `fill` the colour below. */}
      <WaveDivider className="bg-forest-950" fill="#F1EDE4" />

      {/* the human context Manu is built on */}
      <PhraseTicker />
      <CulturalIntelligence />
      <MomentsMosaic />

      {/* ways in */}
      <HowItWorks />
      <ToolsSection />

      {/* reassurance */}
      <WhyMannMatters />
      <Testimonials />
      <BlogTeaser />
      <WaveDivider className="bg-ivory" fill="#06211C" />
      <CTABand />
    </>
  );
}
