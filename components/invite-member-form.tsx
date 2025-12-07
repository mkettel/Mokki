"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendInvite } from "@/lib/actions/invites";

interface InviteMemberFormProps {
  houseId: string;
}

export function InviteMemberForm({ houseId }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    try {
      const result = await sendInvite(houseId, email.trim());

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.alreadyUser) {
        setSuccess(`${email} has been added to the house!`);
      } else if (result.emailSent) {
        setSuccess(`Invite sent to ${email}`);
      } else {
        setSuccess(`Invite created for ${email} (email could not be sent)`);
      }

      setEmail("");
      router.refresh();
    } catch (err) {
      console.error("Error inviting member:", err);
      setError("Failed to send invite. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1 space-y-2">
        <Label htmlFor="email" className="sr-only">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Invite"}
      </Button>
    </form>
  );
}
