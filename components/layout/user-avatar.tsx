"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { profileInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  email: string;
  name?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function UserAvatar({ email, name, size = "default", className }: UserAvatarProps) {
  const initials = profileInitials(name ?? "", email);

  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground sm:text-sm">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
