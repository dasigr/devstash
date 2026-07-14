import type { ReactNode } from "react";

/**
 * One FAQ entry: a question with a monospace brand `Q.` marker, and an answer
 * that may contain inline `<code>` (hence `ReactNode`). Ports the prototype's
 * `.faq-item`.
 */
export function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--m-border)] bg-[var(--m-surface)] px-[22px] py-5">
      <h3 className="mb-2 flex items-start gap-2.5 text-[1.04rem] font-bold">
        <span aria-hidden="true" className="flex-shrink-0 font-mono text-[var(--m-brand)]">
          Q.
        </span>
        <span>{question}</span>
      </h3>
      <p className="text-[0.95rem] text-[var(--m-text-dim)]">{answer}</p>
    </div>
  );
}
