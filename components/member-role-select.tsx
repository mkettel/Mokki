"use client";

import { useState, useTransition } from "react";
import { updateMemberRole } from "@/lib/actions/house";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface MemberRoleSelectProps {
  memberId: string;
  currentRole: "admin" | "member";
  isCurrentUser: boolean;
}

export function MemberRoleSelect({
  memberId,
  currentRole,
  isCurrentUser,
}: MemberRoleSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (newRole: "admin" | "member") => {
    if (newRole === currentRole) return;

    setError(null);
    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="focus:outline-none"
          disabled={isPending}
        >
          <Badge
            variant={currentRole === "admin" ? "default" : "secondary"}
            className="cursor-pointer flex items-center gap-1"
          >
            {isPending ? "..." : currentRole}
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleRoleChange("admin")}
            className={currentRole === "admin" ? "bg-accent" : ""}
          >
            Admin
            {currentRole === "admin" && (
              <span className="ml-auto text-xs text-muted-foreground">
                current
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleRoleChange("member")}
            className={currentRole === "member" ? "bg-accent" : ""}
          >
            Member
            {currentRole === "member" && (
              <span className="ml-auto text-xs text-muted-foreground">
                current
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isCurrentUser && (
        <span className="text-xs text-muted-foreground">(you)</span>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
