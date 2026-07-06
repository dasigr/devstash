import { cn } from "@/lib/utils";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";

interface ItemTypeBadgeProps {
  /** Only the fields needed to render the badge (name, color, lucide icon). */
  type: { name: string; color: string; icon: string };
  size?: "sm" | "md";
  className?: string;
}

const SIZES = {
  sm: { box: "size-6 rounded-md", icon: "size-3.5" },
  md: { box: "size-8 rounded-lg", icon: "size-4" },
} as const;

/**
 * A rounded square holding an item type's colored icon on a tint of its color.
 * Used on collection cards (row of type badges) and item cards (leading glyph).
 */
export function ItemTypeBadge({ type, size = "md", className }: ItemTypeBadgeProps) {
  const s = SIZES[size];
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", s.box, className)}
      // Tinted background is data-driven (per item type), so it must be inline.
      style={{ backgroundColor: `${type.color}1f` }}
      title={type.name}
    >
      <ItemTypeIcon name={type.icon} color={type.color} className={s.icon} />
    </span>
  );
}