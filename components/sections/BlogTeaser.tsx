import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import PostCover from "@/components/blog/PostCover";
import { posts } from "@/lib/posts";

/* Three cards, three colours — the category chip, the hover rule and the
   headline all take the same hue, so each card is its own object. */
const HUES = [
  { c: "#E36A3B", ink: "#9A3410" },
  { c: "#4356CE", ink: "#2C3A9B" },
  { c: "#0E9FA6", ink: "#076166" },
];

export default function BlogTeaser() {
  const latest = posts.slice(0, 3);

  return (
    <section className="section relative overflow-hidden">
      <div className="mesh-warm pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="wrap-wide relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="from the journal"
            deva="मन"
            title="Read something kind to yourself"
          />
          <Reveal delay={0.2} className="mb-10 md:mb-14">
            <Link href="/blog" className="link-draw font-medium text-kesar-ink">
              All articles →
            </Link>
          </Reveal>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {latest.map((post, i) => {
            const hue = HUES[i % HUES.length];
            return (
            <Reveal key={post.slug} delay={i * 0.12}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl shadow-lift">
                  <PostCover
                    post={post}
                    sizes="(max-width: 768px) 90vw, 30vw"
                    className="aspect-[3/2] w-full transition-transform duration-700 ease-silk group-hover:scale-[1.05]"
                  />
                  <span
                    className="absolute inset-x-0 bottom-0 h-[3px] w-0 transition-all duration-700 ease-silk group-hover:w-full"
                    style={{ background: `linear-gradient(90deg, ${hue.c}, ${hue.c}66)` }}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em]">
                  <span
                    className="rounded-full border px-2.5 py-1"
                    style={{
                      borderColor: `${hue.c}4D`,
                      background: `${hue.c}14`,
                      color: hue.ink,
                    }}
                  >
                    {post.category}
                  </span>
                  <span className="normal-case tracking-normal text-ink/50">{post.readTime}</span>
                </p>
                <h3 className="mt-3 font-display text-[1.45rem] font-medium leading-snug text-forest-900 transition-colors duration-500 group-hover:text-forest-600">
                  {post.title}
                </h3>
              </Link>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
