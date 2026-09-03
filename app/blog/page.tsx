import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";
import InkLines from "@/components/visuals/InkLines";
import Reveal from "@/components/ui/Reveal";
import { posts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog — Notes on minds, gently written",
  description:
    "Essays on anxiety, relationships, student life, workplace burnout, and self-care — written by Emoraa psychologists, for India.",
};

export default function BlogPage() {
  return (
    <div className="page-top pb-24">
      {/* the heading, with the page writing itself alongside it */}
      <section className="relative overflow-hidden pb-4 md:min-h-[420px]">
        {/* a line per post — click one and it rewrites itself */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block"
          aria-hidden="true"
        >
          <div
            className="pointer-events-auto h-full w-full opacity-[0.9]"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
            }}
          >
            <InkLines />
          </div>
        </div>
        {/* scrim keeps the headline legible where it meets the canvas */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[58%] md:block"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, #F7F4EE 0%, #F7F4EE 40%, #F7F4EEd9 62%, #F7F4EE00 100%)",
          }}
        />
        <div className="wrap-wide pointer-events-none relative z-10">
          <Reveal>
          <p className="eyebrow mb-5 flex items-center gap-3">
            <span className="font-deva text-sm normal-case tracking-normal text-gold" aria-hidden="true">मन</span>
            the journal
          </p>
          <h1 className="h-display max-w-3xl text-5xl md:text-7xl">
            Notes on minds, <em className="text-forest-600">gently written</em>
          </h1>
          <p className="mt-7 max-w-xl text-lg text-ink/70">
            Written by our psychologists. No miracle hacks, no 5 a.m. clubs —
            just honest, useful thinking about how we actually feel.
          </p>
          </Reveal>
        </div>
      </section>

      <div className="wrap-wide">
        <BlogIndex posts={posts} />
      </div>
    </div>
  );
}
