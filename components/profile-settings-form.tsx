"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/profile";

interface ProfileSettingsFormProps {
  profile: {
    email: string;
    display_name: string | null;
  };
}

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfile(displayName);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess("Profile updated successfully");
      router.refresh();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          type="text"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={100}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          This is how your name appears to other members
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
