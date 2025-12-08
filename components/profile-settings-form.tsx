"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/profile";
import { RiderType } from "@/types/database";
import { AvatarUpload } from "@/components/avatar-upload";

interface ProfileSettingsFormProps {
  profile: {
    email: string;
    display_name: string | null;
    rider_type: RiderType | null;
    avatar_url: string | null;
    tagline: string | null;
  };
}

const riderOptions: { value: RiderType; label: string; emoji: string }[] = [
  { value: "skier", label: "Skier", emoji: "⛷️" },
  { value: "snowboarder", label: "Snowboarder", emoji: "🏂" },
  { value: "both", label: "Both", emoji: "⛷️🏂" },
];

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [riderType, setRiderType] = useState<RiderType | null>(
    profile.rider_type
  );
  const [tagline, setTagline] = useState(profile.tagline || "");
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
      const result = await updateProfile(displayName, riderType, tagline);

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
    <div className="space-y-8">
      {/* Avatar Upload - separate from main form */}
      <div className="flex flex-col items-center pb-6 border-b">
        <AvatarUpload
          currentAvatarUrl={profile.avatar_url}
          displayName={profile.display_name}
          email={profile.email}
        />
      </div>

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

        <div className="grid gap-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            type="text"
            placeholder="Your motto or favorite quote"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={100}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            A short quote or tagline for your yearbook profile (optional)
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Rider Type</Label>
          <div className="flex gap-2">
            {riderOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRiderType(option.value)}
                disabled={isLoading}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  riderType === option.value
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Are you a skier, snowboarder, or both?
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
