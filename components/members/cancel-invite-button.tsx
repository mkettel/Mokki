"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeMember } from "@/lib/actions/house";

interface CancelInviteButtonProps {
  memberId: string;
}

export function CancelInviteButton({ memberId }: CancelInviteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    await removeMember(memberId);
    setIsLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancel}
      disabled={isLoading}
      className="text-muted-foreground hover:text-destructive"
    >
      <X className="h-4 w-4 mr-1" />
      {isLoading ? "Canceling..." : "Cancel"}
    </Button>
  );
}
