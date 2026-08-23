import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import PostCover from "@/components/blog/PostCover";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ArticleContents from "@/components/blog/ArticleContents";
import ShareRow from "@/components/blog/ShareRow";
import { getPost, headingId, headingsOf, posts } from "@/lib/posts";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author.name],
    },
  };
}

/** Two initials, for the author medallion. */
function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => !w.endsWith("."))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const headings = headingsOf(post);
  const related = posts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2);
  const keepReading = related.length
    ? related
    : posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <ReadingProgress readTime={post.readTime} />

      <article className="page-top pb-24">
        {/* ── masthead ─────────────────────────────────────────────── */}
        <header className="wrap-wide">
          <Reveal>
            <Link href="/blog" className="link-draw text-sm font-medium text-forest-700">
              ← The journal
            </Link>
          </Reveal>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <Reveal from="left">
              <p className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-forest-600">
                {post.category}
                <span className="h-px w-5 bg-gold" aria-hidden="true" />
                <span className="normal-case tracking-normal text-ink/50">{post.readTime}</span>
              </p>
              <h1 className="h-display mt-5 text-4xl leading-[1.06] md:text-[3.4rem]">
                {post.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">{post.excerpt}</p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-light/70 font-display text-sm font-medium text-forest-800"
                  aria-hidden="true"
                >
                  {initials(post.author.name)}
                </span>
                <div className="text-sm leading-snug">
                  <p className="font-semibold text-forest-800">{post.author.name}</p>
                  <p className="text-ink/55">
                    {post.author.role} · {post.displayDate}
                  </p>
                </div>
              </div>

              <ShareRow title={post.title} className="mt-7" />
            </Reveal>

            <Reveal from="right" delay={0.1}>
              <div className="overflow-hidden rounded-3xl shadow-bloom">
                <PostCover
                  post={post}
                  eager
                  sizes="(max-width: 1024px) 92vw, 46vw"
                  className="aspect-[4/3] w-full"
                />
              </div>
            </Reveal>
          </div>
        </header>

        {/* ── the short version ────────────────────────────────────── */}
        <Reveal delay={0.1} className="wrap-wide mt-16 md:mt-20">
          <div className="rounded-3xl border border-gold/30 bg-gold/[0.07] p-8 md:p-10">
            <p className="eyebrow mb-6 flex items-center gap-3 text-gold-dark">
              <span className="font-deva text-sm normal-case tracking-normal" aria-hidden="true">मन</span>
              the short version
            </p>
            <ol className="grid gap-6 md:grid-cols-3">
              {post.takeaways.map((t, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-display text-2xl font-medium leading-none text-gold-dark/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[0.95rem] leading-relaxed text-ink/80">{t}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        {/* ── the essay, with its contents alongside ───────────────── */}
        <div className="wrap-wide mt-16 grid gap-12 md:mt-20 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <ArticleContents headings={headings} />
              <div className={headings.length > 1 ? "mt-10 border-t border-forest-800/10 pt-6" : ""}>
                <ShareRow title={post.title} className="flex-col !items-start gap-3" />
              </div>
            </div>
          </aside>

          <div>
            <div className="prose-mm">
              {post.content.map((block, i) => {
                if (block.type === "h2")
                  return (
                    <h2 key={i} id={headingId(block.text)} className="scroll-mt-28">
                      {block.text}
                    </h2>
                  );
                if (block.type === "quote") return <blockquote key={i}>{block.text}</blockquote>;
                return <p key={i}>{block.text}</p>;
              })}
            </div>

            {/* put it into practice — outside .prose-mm, whose `p` rule would
                repaint this light-on-dark text with body ink */}
            <div className="mx-auto max-w-measure">
              <Link
                href={post.tool.href}
                className="card-lift group mt-14 flex items-center gap-5 rounded-3xl border border-forest-800/10 bg-sage-light/35 p-7 md:p-8"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ivory text-forest-700">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M12 3.5c1.9 3.9 5 4.8 5 8.6a5 5 0 0 1-10 0c0-3.8 3.1-4.7 5-8.6Z" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.18em] text-forest-600">
                    try it now · free
                  </span>
                  <span className="mt-1.5 block font-display text-xl font-medium text-forest-900 transition-colors group-hover:text-forest-600">
                    {post.tool.label}
                    <span className="ml-2 inline-block transition-transform duration-500 ease-silk group-hover:translate-x-1" aria-hidden="true">
                      →
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[0.93rem] leading-relaxed text-ink/65">
                    {post.tool.note}
                  </span>
                </span>
              </Link>

              <div className="mt-8 rounded-3xl bg-forest-950 p-8 text-ivory md:p-10">
                <p className="font-display text-xl font-medium text-ivory">
                  If this landed a little close to home — that&apos;s worth listening to.
                </p>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-sage-light/80">
                  A first session is just a conversation, from ₹599. No diagnosis on day
                  one, and no one else needs to know.
                </p>
                <div className="mt-6">
                  <Button href="/book" variant="gold">
                    Book a session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── keep reading ─────────────────────────────────────────── */}
        <div className="wrap-wide mt-24">
          <div className="border-t border-forest-800/10 pt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="eyebrow">Keep reading</p>
              <Link href="/blog" className="link-draw text-sm font-medium text-forest-700">
                All articles →
              </Link>
            </div>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              {keepReading.map((p) => (
                <Link key={p.slug} href={"/blog/" + p.slug} className="group block">
                  <div className="overflow-hidden rounded-2xl shadow-lift">
                    <PostCover
                      post={p}
                      sizes="(max-width: 640px) 92vw, 40vw"
                      className="aspect-[3/2] w-full transition-transform duration-700 ease-silk group-hover:scale-[1.05]"
                    />
                  </div>
                  <p className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-forest-600">
                    {p.category}
                    <span className="h-px w-5 bg-gold" aria-hidden="true" />
                    <span className="normal-case tracking-normal text-ink/50">{p.readTime}</span>
                  </p>
                  <h3 className="mt-2.5 font-display text-xl font-medium leading-snug text-forest-900 transition-colors group-hover:text-forest-600">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
