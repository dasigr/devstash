"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user/UserAvatar";
import { cn } from "@/lib/utils";

export interface SidebarUserData {
  name: string | null;
  email: string | null;
  image: string | null;
  isPro: boolean;
}

interface SidebarUserProps {
  user: SidebarUserData;
  collapsed: boolean;
}

/**
 * User area at the bottom of the sidebar. Clicking the avatar/row opens an
 * upward dropdown with a link to the profile page and a sign-out action.
 */
export function SidebarUser({ user, collapsed }: SidebarUserProps) {
  const router = useRouter();
  const displayName = user.name ?? "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-1 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed && "justify-center"
        )}
      >
        <UserAvatar
          name={user.name}
          image={user.image}
          className="shrink-0"
        />
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.isPro ? "Pro" : "Free"}
              {user.email ? ` · ${user.email}` : ""}
            </p>
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-56">
        <div className="flex flex-col gap-0.5 px-1.5 py-1">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          {user.email && (
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
