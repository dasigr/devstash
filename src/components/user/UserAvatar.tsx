import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Derive up to two uppercase initials from a name.
 * "Brad Traversy" -> "BT", "juan" -> "J", falls back to "?".
 */
export function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface UserAvatarProps {
  name?: string | null;
  /** GitHub (or other OAuth) image URL. Falls back to initials when absent. */
  image?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * Reusable user avatar: renders the provided image when present, otherwise a
 * neutral circle with the user's initials. Base UI's Avatar also swaps to the
 * fallback automatically if the image fails to load.
 */
export function UserAvatar({
  name,
  image,
  size = "default",
  className,
}: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn(className)}>
      {image ? <AvatarImage src={image} alt={name ?? "User avatar"} /> : null}
      <AvatarFallback className="bg-linear-to-br from-violet-500 to-blue-500 font-semibold text-white">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
