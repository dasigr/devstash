import {
  Code,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

/** Maps the `icon` string on an item type (see mock-data) to its lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  StickyNote,
  Terminal,
  Link: LinkIcon,
  File,
  Image: ImageIcon,
};

interface ItemTypeIconProps {
  /** lucide icon name from the item type. */
  name: string;
  /** Item-type accent color; applied to the icon. */
  color?: string;
  className?: string;
}

export function ItemTypeIcon({ name, color, className }: ItemTypeIconProps) {
  const Icon = ICONS[name] ?? Code;
  // Color is data-driven (per item type), so it must be an inline style.
  return <Icon className={className} style={color ? { color } : undefined} />;
}