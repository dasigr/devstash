import { PREVIEW_CARDS, PREVIEW_NAV } from "./constants";

/**
 * The "…with DevStash" panel: a static mock of the app — a mini sidebar with
 * accent-swatched nav rows and a grid of item cards whose top border is colored
 * by item type. Pure presentational markup.
 */
export function DashboardPreview() {
  return (
    <div className="flex h-[340px] flex-col rounded-[14px] border border-[rgba(99,102,241,0.25)] bg-[linear-gradient(180deg,var(--m-surface),var(--m-bg-soft))] p-[18px]">
      <span className="mb-3 block text-center text-[0.82rem] font-semibold text-[var(--m-text-mute)]">
        …with DevStash
      </span>
      <div className="grid flex-1 grid-cols-[92px_1fr] gap-2.5 overflow-hidden rounded-[10px] border border-[var(--m-border)] bg-[var(--m-bg)] p-2.5">
        <aside className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-[0.72rem] font-bold">
            <span className="size-3 rounded-[4px] bg-[linear-gradient(135deg,var(--m-brand),var(--m-brand-2))]" />
            DevStash
          </div>
          <ul className="flex flex-col gap-[5px]">
            {PREVIEW_NAV.map((row, i) => (
              <li
                key={row.label}
                className={`flex items-center gap-1.5 rounded-md px-[5px] py-[3px] text-[0.66rem] ${
                  i === 0
                    ? "bg-[var(--m-surface-2)] text-[var(--m-text)]"
                    : "text-[var(--m-text-mute)]"
                }`}
              >
                <span
                  className="size-2 shrink-0 rounded-[3px]"
                  style={{ background: row.accent }}
                />
                {row.label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="h-4 rounded-md bg-[var(--m-surface-2)]" />
          <div className="grid grid-cols-3 gap-2">
            {PREVIEW_CARDS.map((accent, i) => (
              <div
                key={i}
                className="flex min-h-[46px] flex-col gap-[5px] rounded-lg border border-[var(--m-border)] bg-[var(--m-surface)] px-[7px] py-2"
                style={{ borderTop: `3px solid ${accent}` }}
              >
                <span className="h-[5px] w-4/5 rounded-[3px] bg-[var(--m-surface-2)]" />
                <span className="h-[5px] w-[55%] rounded-[3px] bg-[var(--m-surface-2)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
