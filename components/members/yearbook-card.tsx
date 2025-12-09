"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { RemoveMemberButton } from "./remove-member-button";
import { RoleToggleButton } from "./role-toggle-button";

interface YearbookCardProps {
  memberId: string;
  member: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
    rider_type: "skier" | "snowboarder" | "both" | null;
    tagline: string | null;
  };
  role: "admin" | "member";
  isCurrentUser?: boolean;
  canRemove?: boolean;
  canChangeRole?: boolean;
}

const riderEmoji: Record<string, string> = {
  skier: "⛷️",
  snowboarder: "🏂",
  both: "⛷️🏂",
};

const riderLabel: Record<string, string> = {
  skier: "Skier",
  snowboarder: "Snowboarder",
  both: "Skier & Snowboarder",
};

export function YearbookCard({
  memberId,
  member,
  role,
  isCurrentUser,
  canRemove,
  canChangeRole,
}: YearbookCardProps) {
  const initials = (member.display_name?.[0] || member.email[0]).toUpperCase();
  const name = member.display_name || member.email.split("@")[0];

  return (
    <div
      className={cn(
        "relative bg-[#f5f0e8] dark:bg-[#2a2520] rounded-sm p-2",
        "shadow-[3px_3px_8px_rgba(0,0,0,0.12),-1px_-1px_4px_rgba(255,255,255,0.4)]",
        "dark:shadow-[3px_3px_8px_rgba(0,0,0,0.4)]",
        "border border-[#d4c9b5] dark:border-[#3d352c]",
        "transition-transform duration-200",
        "group"
      )}
    >
      {/* Top right corner: Admin controls and badge */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {canChangeRole && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <RoleToggleButton memberId={memberId} currentRole={role} />
          </div>
        )}
        {canRemove && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <RemoveMemberButton memberId={memberId} memberName={name} />
          </div>
        )}
        {role === "admin" && (
          <div
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium",
              "bg-[#c4a77d] text-[#3d2e1f]"
            )}
          >
            Admin
          </div>
        )}
      </div>

      {/* Photo frame effect */}
      <div className="relative mx-auto w-full h-auto mb-3">
        <div
          className={cn(
            "absolute inset-0 bg-[#e8e0d4] dark:bg-[#3d352c]",
            "shadow-inner rounded-sm"
          )}
        />
        <Avatar className="relative w-full h-full rounded-sm">
          <AvatarImage
            src={member.avatar_url || undefined}
            alt={name}
            className="object-cover"
          />
          <AvatarFallback
            className={cn(
              "rounded-sm text-2xl sm:text-3xl min-h-60 min-w-10 font-serif",
              "bg-gradient-to-br from-[#d4c9b5] to-[#b8a990]",
              "text-[#5c4d3d]"
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name with serif font */}
      <h3
        className={cn(
          "text-center font-serif text-base sm:text-lg font-semibold leading-tight",
          "text-[#3d2e1f] dark:text-[#e8e0d4]"
        )}
      >
        {name}
        {isCurrentUser && (
          <span className="text-xs font-normal text-muted-foreground ml-1">
            (you)
          </span>
        )}
      </h3>

      {/* Rider type */}
      {member.rider_type && (
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-1">
          {riderEmoji[member.rider_type]} {riderLabel[member.rider_type]}
        </p>
      )}

      {/* Tagline/quote */}
      {member.tagline && (
        <p
          className={cn(
            "text-center text-xs sm:text-sm italic mt-2 px-1",
            "text-[#6b5a48] dark:text-[#a89580]",
            "font-serif leading-snug line-clamp-2"
          )}
        >
          &ldquo;{member.tagline}&rdquo;
        </p>
      )}
    </div>
  );
}
