import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveHouse } from "@/lib/actions/house";
import { getResorts } from "@/lib/actions/resorts";
import { getUserGuestFeesSummary, getUserStaysWithGuestFees } from "@/lib/actions/guest-fees";
import { GuestFeeSummary } from "@/components/account/guest-fee-summary";
import { UserStaysHistory } from "@/components/account/user-stays-history";
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

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { house: activeHouse } = await getActiveHouse();

  if (!activeHouse) {
    redirect("/create-house");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name, rider_type, avatar_url, tagline, venmo_handle")
    .eq("id", user.id)
    .single();

  const [{ summary }, { stays }, { resorts }] = await Promise.all([
    getUserGuestFeesSummary(activeHouse.id),
    getUserStaysWithGuestFees(activeHouse.id),
    getResorts(),
  ]);

  // Check if user is admin of the active house
  const isAdmin = activeHouse.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl uppercase font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your profile and view guest fee history
        </p>
      </div>

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

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              House Settings
            </CardTitle>
            <CardDescription>
              Manage settings for {activeHouse.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HouseSettingsForm house={activeHouse} resorts={resorts} />
          </CardContent>
        </Card>
      )}

      <GuestFeeSummary summary={summary} />

      <UserStaysHistory stays={stays} currentUserId={user.id} />

      <div className="pt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
