import { BLOG_AUTHOR, BLOG_AUTHOR_BIO, initials } from "./constants";

/**
 * The blog detail page's author card (`.author-bio`): a larger (54px)
 * brand-gradient avatar chip beside the author name and a dim bio line. The
 * avatar mirrors `PostMeta`'s chip but at a bigger size.
 */
export function AuthorBio() {
  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-[var(--m-border)] bg-[var(--m-surface)] p-6">
      <span
        aria-hidden="true"
        className="grid size-[54px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--m-brand),var(--m-brand-2))] text-base font-bold text-white"
      >
        {initials(BLOG_AUTHOR)}
      </span>
      <div>
        <h4 className="text-[1.02rem] font-bold">{BLOG_AUTHOR}</h4>
        <p className="mt-1 text-[0.9rem] text-[var(--m-text-dim)]">
          {BLOG_AUTHOR_BIO}
        </p>
      </div>
    </div>
  );
}
