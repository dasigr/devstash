import { Boxes } from "lucide-react";

/**
 * DevStash brand mark + name.
 * The gradient uses the Snippet/Prompt accent hues from the item-type palette.
 * When `collapsed`, only the brand mark is shown (icon-only sidebar rail).
 */
export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-blue-500 text-white">
        <Boxes className="size-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">DevStash</p>
          <p className="text-xs text-muted-foreground">
            Developer knowledge hub
          </p>
        </div>
      )}
    </div>
  );
}