"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendInvite } from "@/lib/actions/invites";

interface ResendInviteButtonProps {
  memberId: string;
}

export function ResendInviteButton({ memberId }: ResendInviteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const router = useRouter();

  const handleResend = async () => {
    setIsLoading(true);
    setStatus("idle");

    try {
      const result = await resendInvite(memberId);

      if (result.error) {
        setStatus("error");
        alert(result.error);
        return;
      }

      setStatus("success");
      router.refresh();

      // Reset success state after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Error resending invite:", err);
      setStatus("error");
      alert("Failed to resend invite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleResend}
      disabled={isLoading}
      className={status === "success" ? "text-green-600" : ""}
    >
      <Send className="h-4 w-4 mr-1" />
      {isLoading ? "Sending..." : status === "success" ? "Sent!" : "Resend"}
    </Button>
  );
}
