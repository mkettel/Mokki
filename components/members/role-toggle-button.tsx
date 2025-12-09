"use client";

import { useState } from "react";
import { Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateMemberRole } from "@/lib/actions/house";
import { cn } from "@/lib/utils";

interface RoleToggleButtonProps {
  memberId: string;
  currentRole: "admin" | "member";
}

export function RoleToggleButton({ memberId, currentRole }: RoleToggleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsLoading(true);
    setError(null);

    const newRole = currentRole === "admin" ? "member" : "admin";
    const result = await updateMemberRole(memberId, newRole);

    if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const isAdmin = currentRole === "admin";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
              "h-7 w-7",
              isAdmin
                ? "text-[#c4a77d] hover:text-destructive hover:bg-destructive/10"
                : "text-muted-foreground hover:text-[#c4a77d] hover:bg-[#c4a77d]/10"
            )}
          >
            {isAdmin ? (
              <ShieldOff className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : isAdmin ? (
            "Remove admin role"
          ) : (
            "Make admin"
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
