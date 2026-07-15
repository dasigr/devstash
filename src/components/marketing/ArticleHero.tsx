/**
 * The blog detail page's hero banner (`.article__hero`): a tall, rounded,
 * bordered frame holding the post's cover image (a local solid-colored
 * placeholder for now — replace per post). Height scales down on small screens.
 */
export function ArticleHero({ image, alt }: { image: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--m-border)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> so cover images (local placeholders or remote Unsplash URLs) work without next/image remote-pattern config. */}
      <img
        src={image}
        alt={alt}
        className="h-[220px] w-full object-cover sm:h-[280px] lg:h-[320px]"
      />
    </div>
  );
}
