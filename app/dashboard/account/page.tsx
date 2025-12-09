import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveHouse } from "@/lib/actions/house";
import { getResorts } from "@/lib/actions/resorts";
import { getUserGuestFeesSummary, getUserStaysWithGuestFees } from "@/lib/actions/guest-fees";
import { AccountContent } from "@/components/account/account-content";

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
    <AccountContent
      profile={profile}
      house={activeHouse}
      resorts={resorts}
      summary={summary}
      stays={stays}
      currentUserId={user.id}
      isAdmin={isAdmin}
    />
  );
}
