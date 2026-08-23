"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import PostCover from "@/components/blog/PostCover";
import Reveal from "@/components/ui/Reveal";
import { categories, type Post } from "@/lib/posts";

const EASE = [0.22, 1, 0.36, 1] as const;

function Meta({ post, className }: { post: Post; className?: string }) {
  return (
    <p className={"flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-forest-600 " + (className ?? "")}>
      {post.category}
      <span className="h-px w-5 bg-gold" aria-hidden="true" />
      <span className="normal-case tracking-normal text-ink/50">{post.readTime}</span>
    </p>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={"/blog/" + post.slug} className="group block h-full">
      <div className="relative overflow-hidden rounded-2xl shadow-lift">
        <PostCover
          post={post}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
          className="aspect-[3/2] w-full transition-transform duration-700 ease-silk group-hover:scale-[1.05]"
        />
        <span
          className="absolute inset-x-0 bottom-0 h-[3px] w-0 bg-gold transition-all duration-700 ease-silk group-hover:w-full"
          aria-hidden="true"
        />
      </div>
      <Meta post={post} className="mt-5" />
      <h3 className="mt-3 font-display text-[1.4rem] font-medium leading-snug text-forest-900 transition-colors group-hover:text-forest-600">
        {post.title}
      </h3>
      <p className="mt-2.5 line-clamp-2 text-[0.93rem] leading-relaxed text-ink/65">
        {post.excerpt}
      </p>
      <p className="mt-4 text-sm text-ink/50">
        {post.author.name} · {post.displayDate}
      </p>
    </Link>
  );
}

export default function BlogIndex({ posts }: { posts: Post[] }) {
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const inCategory = category === "All" || p.category === category;
      const inQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q);
      return inCategory && inQuery;
    });
  }, [posts, category, query]);

  const unfiltered = category === "All" && !query.trim();
  const featured = unfiltered ? posts.find((p) => p.featured) ?? posts[0] : null;
  const grid = featured ? filtered.filter((p) => p.slug !== featured.slug) : filtered;

  /** How many pieces survived the filter, said in words. */
  const count =
    filtered.length === 0
      ? "Nothing here yet"
      : filtered.length + (filtered.length === 1 ? " piece" : " pieces") +
        (category === "All" ? "" : " on " + category.toLowerCase());

  return (
    <>
      {/* filters */}
      <Reveal delay={0.1} className="mt-14 border-y border-forest-800/10 py-5">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {categories.map((c) => {
              const on = c === category;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={on}
                  className={
                    "relative rounded-full px-4 py-2 text-sm transition-colors duration-300 " +
                    (on ? "text-ivory" : "text-ink/60 hover:text-forest-800")
                  }
                >
                  {on && (
                    <motion.span
                      layoutId="blog-filter-pill"
                      className="absolute inset-0 rounded-full bg-forest-800"
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  )}
                  <span className="relative">{c}</span>
                </button>
              );
            })}
          </div>

          <label className="relative flex min-w-[15rem] flex-1 items-center sm:max-w-xs">
            <span className="sr-only">Search articles</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-4 text-ink/35"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search — sleep, parents, burnout…"
              className="w-full rounded-full border border-forest-800/15 bg-ivory-light py-2.5 pl-11 pr-4 text-sm text-forest-900 outline-none transition-colors placeholder:text-ink/35 focus:border-gold"
            />
          </label>
        </div>
      </Reveal>

      <p className="mt-6 text-sm text-ink/45" aria-live="polite">
        {count}
      </p>

      {/* featured — only when nothing is filtered, so it never fights the grid */}
      <AnimatePresence initial={false}>
        {featured && (
          <motion.div
            key="featured"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-10"
          >
            <Link
              href={"/blog/" + featured.slug}
              className="group grid items-center gap-8 lg:grid-cols-5 lg:gap-14"
            >
              <div className="overflow-hidden rounded-3xl shadow-bloom lg:col-span-3">
                <PostCover
                  post={featured}
                  eager
                  sizes="(max-width: 1024px) 92vw, 56vw"
                  className="aspect-[16/10] w-full transition-transform duration-700 ease-silk group-hover:scale-[1.04]"
                />
              </div>
              <div className="lg:col-span-2">
                <p className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-forest-600">
                  featured · {featured.category}
                  <span className="h-px w-5 bg-gold" aria-hidden="true" />
                  <span className="normal-case tracking-normal text-ink/50">{featured.readTime}</span>
                </p>
                <h2 className="h-display mt-4 text-3xl leading-tight transition-colors group-hover:text-forest-600 md:text-[2.6rem]">
                  {featured.title}
                </h2>
                <p className="mt-5 leading-relaxed text-ink/70">{featured.excerpt}</p>
                <p className="mt-6 text-sm text-ink/55">
                  {featured.author.name} · {featured.displayDate}
                </p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* grid */}
      <motion.div layout className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 md:mt-20">
        <AnimatePresence mode="popLayout">
          {grid.map((post) => (
            <motion.div
              key={post.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-3xl border border-forest-800/10 bg-ivory-light px-8 py-14 text-center">
          <p className="font-display text-2xl text-forest-900">Nothing matches that yet.</p>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink/60">
            We&apos;re writing more every month. In the meantime, the whole journal is
            two clicks away.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory("All");
              setQuery("");
            }}
            className="mt-7 rounded-full bg-forest-800 px-7 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-600"
          >
            Show everything
          </button>
        </div>
      )}
    </>
  );
}
