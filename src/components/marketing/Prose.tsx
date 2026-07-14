import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Shared marketing article typography, as Tailwind arbitrary-value child
 * selectors — no new `globals.css` classes (matching the About / Blog Listing
 * rebuilds). Consumed by both `Prose` (blog-post Markdown) and `DocsSection`
 * (inline JSX docs content) so the two render identical prose.
 */
export const proseClassName = [
  // paragraphs
  "[&_p]:mb-4 [&_p]:leading-[1.8] [&_p]:text-[var(--m-text-dim)]",
  // headings
  "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[1.5rem] [&_h2]:font-extrabold [&_h2]:tracking-[-0.01em]",
  "[&_h3]:mt-8 [&_h3]:mb-2.5 [&_h3]:text-[1.2rem] [&_h3]:font-bold",
  // inline code
  "[&_code]:rounded [&_code]:bg-[var(--m-surface-2)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]",
  // code blocks (+ reset the inline-code chip styling inside)
  "[&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:border [&_pre]:border-[var(--m-border-2)] [&_pre]:bg-[#0d1117] [&_pre]:p-[18px] [&_pre]:text-[0.84rem] [&_pre]:leading-[1.7]",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.84rem]",
  // blockquote
  "[&_blockquote]:my-6 [&_blockquote]:rounded-r [&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--m-brand)] [&_blockquote]:bg-[color-mix(in_srgb,var(--m-brand)_8%,transparent)] [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-[var(--m-text)] [&_blockquote_p]:mb-0 [&_blockquote_p]:text-[var(--m-text)]",
  // lists / emphasis / links
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2 [&_li]:text-[var(--m-text-dim)]",
  "[&_strong]:text-[var(--m-text)]",
  "[&_a]:text-[var(--m-brand)] [&_a:hover]:underline",
].join(" ");

/**
 * Renders a blog post's Markdown `content` via react-markdown + remark-gfm (the
 * same stack as the dashboard's MarkdownEditor). react-markdown renders no raw
 * HTML by default, so the blog copy is safe to render.
 *
 * Renders nothing when `content` is empty, so a future content-less post never
 * crashes.
 */
export function Prose({ content }: { content: string }) {
  if (!content.trim()) return null;

  return (
    <div className={proseClassName}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
