/**
 * Small shared byline: a brand-gradient avatar initials chip, an optional author
 * name (shown on the featured card and the detail stub, omitted on grid cards),
 * and a dot-separated date + read time. Reused by `BlogFeatured`, `BlogCard`,
 * and the `/blogs/[slug]` detail stub.
 */
export function PostMeta({
  author,
  date,
  readTime,
  initials,
}: {
  author?: string;
  date: string;
  readTime: string;
  initials: string;
}) {
  return (
    <div className="mt-4 flex items-center gap-2.5 text-[0.82rem] text-[var(--m-text-mute)]">
      <span
        aria-hidden="true"
        className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--m-brand),var(--m-brand-2))] text-[0.72rem] font-bold text-white"
      >
        {initials}
      </span>
      {author && (
        <>
          <span>{author}</span>
          <Dot />
        </>
      )}
      <span>{date}</span>
      <Dot />
      <span>{readTime}</span>
    </div>
  );
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="size-[3px] shrink-0 rounded-full bg-[var(--m-text-mute)]"
    />
  );
}
