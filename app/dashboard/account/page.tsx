import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveHouse } from "@/lib/actions/house";
import { getUserGuestFeesSummary, getUserStaysWithGuestFees } from "@/lib/actions/guest-fees";
import { GuestFeeSummary } from "@/components/account/guest-fee-summary";
import { UserStaysHistory } from "@/components/account/user-stays-history";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";

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
    .select("email, display_name, rider_type")
    .eq("id", user.id)
    .single();

  const { summary } = await getUserGuestFeesSummary(activeHouse.id);
  const { stays } = await getUserStaysWithGuestFees(activeHouse.id);

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

      <GuestFeeSummary summary={summary} />

      <UserStaysHistory stays={stays} currentUserId={user.id} />
    </div>
  );
}
