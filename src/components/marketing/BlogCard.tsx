import Link from "next/link";

import { initials, type BlogPost } from "./constants";
import { PostMeta } from "./PostMeta";

/**
 * Grid card for the blog listing: an accent media block (tinted via the per-card
 * `--c` var), a `--c`-colored category tag, title, excerpt, and `PostMeta`.
 * Links to the post's `/blogs/<slug>` detail page.
 */
export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      style={{ "--c": post.accent } as React.CSSProperties}
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--m-border-2)] hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> so cover images (local placeholders or remote Unsplash URLs) work without next/image remote-pattern config. */}
      <img
        src={post.image}
        alt=""
        aria-hidden="true"
        className="h-[150px] w-full object-cover"
      />
      <div className="flex flex-1 flex-col px-5 pb-[22px] pt-5">
        <span className="mb-2.5 self-start text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[var(--c)]">
          {post.category}
        </span>
        <h3 className="mb-2 text-[1.12rem] font-bold tracking-[-0.01em]">
          {post.title}
        </h3>
        <p className="flex-1 text-[0.93rem] text-[var(--m-text-dim)]">
          {post.excerpt}
        </p>
        <PostMeta
          date={post.date}
          readTime={post.readTime}
          initials={initials(post.author)}
        />
      </div>
    </Link>
  );
}
