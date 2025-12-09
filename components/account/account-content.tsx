"use client";

import { motion } from "framer-motion";
import { GuestFeeSummary } from "./guest-fee-summary";
import { UserStaysHistory } from "./user-stays-history";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { HouseSettingsForm } from "@/components/house-settings-form";
import { LogoutButton } from "@/components/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Home } from "lucide-react";
import type { GuestFeeSummary as GuestFeeSummaryType, StayWithGuestFees, Resort } from "@/types/database";

interface Profile {
  email: string | null;
  display_name: string | null;
  rider_type: string | null;
  avatar_url: string | null;
  tagline: string | null;
  venmo_handle: string | null;
}

interface House {
  id: string;
  name: string;
  role: string;
}

interface AccountContentProps {
  profile: Profile | null;
  house: House;
  resorts: Resort[];
  summary: GuestFeeSummaryType | null;
  stays: StayWithGuestFees[];
  currentUserId: string;
  isAdmin: boolean;
}

export function AccountContent({
  profile,
  house,
  resorts,
  summary,
  stays,
  currentUserId,
  isAdmin,
}: AccountContentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl uppercase font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your profile and view guest fee history
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            {profile ? (
              <ProfileSettingsForm profile={profile} />
            ) : (
              <p className="text-red-500">Failed to load profile</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* House Settings Card (Admin only) */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                House Settings
              </CardTitle>
              <CardDescription>
                Manage settings for {house.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HouseSettingsForm house={house} resorts={resorts} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Guest Fee Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: isAdmin ? 0.3 : 0.2, ease: "easeOut" }}
      >
        <GuestFeeSummary summary={summary} />
      </motion.div>

      {/* User Stays History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: isAdmin ? 0.4 : 0.3, ease: "easeOut" }}
      >
        <UserStaysHistory stays={stays} currentUserId={currentUserId} />
      </motion.div>

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: isAdmin ? 0.5 : 0.4, ease: "easeOut" }}
        className="pt-4"
      >
        <LogoutButton />
      </motion.div>
    </div>
  );
}
