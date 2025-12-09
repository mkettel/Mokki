"use client";

import { YearbookCard } from "./yearbook-card";

type MemberProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  rider_type: "skier" | "snowboarder" | "both" | null;
  tagline: string | null;
} | null;

type HouseMember = {
  id: string;
  role: string;
  invite_status: string;
  invited_email: string | null;
  joined_at: string | null;
  profiles: MemberProfile;
};

interface YearbookGridProps {
  members: HouseMember[];
  currentUserId?: string;
  isAdmin?: boolean;
}

export function YearbookGrid({ members, currentUserId, isAdmin }: YearbookGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-2">
      {members.map((member) => {
        const isCurrentUser = member.profiles?.id === currentUserId;
        return (
          <YearbookCard
            key={member.id}
            memberId={member.id}
            member={{
              id: member.profiles?.id || member.id,
              display_name: member.profiles?.display_name || null,
              email: member.profiles?.email || member.invited_email || "",
              avatar_url: member.profiles?.avatar_url || null,
              rider_type: member.profiles?.rider_type || null,
              tagline: member.profiles?.tagline || null,
            }}
            role={member.role as "admin" | "member"}
            isCurrentUser={isCurrentUser}
            canRemove={isAdmin && !isCurrentUser}
            canChangeRole={isAdmin && !isCurrentUser}
          />
        );
      })}
    </div>
  );
}
