import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";
import Reveal from "@/components/ui/Reveal";
import { posts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog — Notes on minds, gently written",
  description:
    "Essays on anxiety, relationships, student life, workplace burnout, and self-care — written by mann Matters psychologists, for India.",
};

export default function BlogPage() {
  return (
    <div className="page-top pb-24">
      <div className="wrap-wide">
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

        <BlogIndex posts={posts} />
      </div>
    </div>
  );
}
