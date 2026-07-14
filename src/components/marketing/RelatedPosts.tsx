import { BlogCard } from "./BlogCard";
import { BLOG_POSTS } from "./constants";

/**
 * The "Keep reading" section: a left-aligned section head + a grid of up to 3
 * `BlogCard`s for other posts (the first 3 of `BLOG_POSTS` excluding the current
 * slug). Renders nothing if there are no other posts.
 */
export function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const related = BLOG_POSTS.filter((post) => post.slug !== currentSlug).slice(
    0,
    3
  );
  if (related.length === 0) return null;

  return (
    <section className="mt-4">
      <h2 className="mb-7 text-[1.4rem] font-extrabold tracking-[-0.01em]">
        Keep reading
      </h2>
      <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
        {related.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
