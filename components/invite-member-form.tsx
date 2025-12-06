"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

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

    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in");
        return;
      }

      // Check if current user is admin
      const { data: membership } = await supabase
        .from("house_members")
        .select("role")
        .eq("house_id", houseId)
        .eq("user_id", user.id)
        .single();

      if (membership?.role !== "admin") {
        setError("Only admins can invite members");
        return;
      }

      // Check if already invited
      const { data: existing } = await supabase
        .from("house_members")
        .select("id, invite_status")
        .eq("house_id", houseId)
        .eq("invited_email", email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        setError("This person has already been invited");
        return;
      }

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (existingProfile) {
        // Check if they're already a member
        const { data: existingMember } = await supabase
          .from("house_members")
          .select("id")
          .eq("house_id", houseId)
          .eq("user_id", existingProfile.id)
          .maybeSingle();

        if (existingMember) {
          setError("This person is already a member");
          return;
        }

        // Add existing user directly
        const { error: memberError } = await supabase
          .from("house_members")
          .insert({
            house_id: houseId,
            user_id: existingProfile.id,
            invited_email: email.toLowerCase().trim(),
            role: "member",
            invite_status: "accepted",
            joined_at: new Date().toISOString(),
          });

        if (memberError) throw memberError;

        setSuccess(`${email} has been added to the house!`);
      } else {
        // Create pending invite
        const { error: inviteError } = await supabase
          .from("house_members")
          .insert({
            house_id: houseId,
            invited_email: email.toLowerCase().trim(),
            role: "member",
            invite_status: "pending",
          });

        if (inviteError) throw inviteError;

        setSuccess(`Invite sent to ${email}`);
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
