import Link from "next/link";

import { initials, type BlogPost } from "./constants";
import { PostMeta } from "./PostMeta";

/**
 * Large 2-column featured card: a layered brand/pink gradient media panel (left)
 * and a body (right) with a category tag, title, excerpt, and an authored
 * `PostMeta`. Stacks to one column (media on top) under `lg`. Links to the
 * post's `/blogs/<slug>` detail page.
 */
export function BlogFeatured({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      aria-label={`Read: ${post.title}`}
      style={{ "--c": post.accent } as React.CSSProperties}
      className="group mb-9 grid grid-cols-1 overflow-hidden rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[var(--m-border-2)] hover:shadow-[0_22px_46px_-26px_rgba(0,0,0,0.7)] lg:grid-cols-[1.1fr_1fr]"
    >
      <div
        aria-hidden="true"
        className="min-h-[180px] lg:min-h-[260px]"
        style={{
          background:
            "radial-gradient(120% 120% at 20% 20%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(120% 120% at 80% 80%, rgba(236,72,153,0.25), transparent 60%), var(--m-surface-2)",
        }}
      />
      <div className="flex flex-col justify-center p-8">
        <span className="self-start text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[var(--c)]">
          {post.category}
        </span>
        <h3 className="mb-3 mt-3.5 text-[1.7rem] font-extrabold tracking-[-0.01em]">
          {post.title}
        </h3>
        <p className="text-[var(--m-text-dim)]">{post.excerpt}</p>
        <PostMeta
          author={post.author}
          date={post.date}
          readTime={post.readTime}
          initials={initials(post.author)}
        />
      </div>
    </Link>
  );
}
