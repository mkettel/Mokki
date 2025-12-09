import { createClient } from "@/lib/supabase/server";
import { getActiveHouse, getHouseWithMembers } from "@/lib/actions/house";
import { MembersContent } from "@/components/members/members-content";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { house: activeHouse } = await getActiveHouse();

  if (!activeHouse) {
    return null;
  }

  const { members } = await getHouseWithMembers(activeHouse.id);
  const acceptedMembers = members.filter((m) => m.invite_status === "accepted");
  const pendingMembers = members.filter((m) => m.invite_status === "pending");
  const isAdmin = activeHouse.role === "admin";

  return (
    <MembersContent
      houseName={activeHouse.name}
      houseId={activeHouse.id}
      acceptedMembers={acceptedMembers}
      pendingMembers={pendingMembers}
      currentUserId={user?.id}
      isAdmin={isAdmin}
    />
  );
}
