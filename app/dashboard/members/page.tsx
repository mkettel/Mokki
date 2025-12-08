import { createClient } from "@/lib/supabase/server";
import { getActiveHouse, getHouseWithMembers } from "@/lib/actions/house";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteMemberForm } from "@/components/invite-member-form";
import { ResendInviteButton } from "@/components/resend-invite-button";
import { YearbookGrid } from "@/components/members/yearbook-grid";

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl text-red uppercase font-bold">Members</h1>
        <p className="text-muted-foreground">
          Manage who has access to {activeHouse.name}
        </p>
      </div>

      {/* Invite Form - Only for admins */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>
              Send an invite to add someone to your house
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm houseId={activeHouse.id} />
          </CardContent>
        </Card>
      )}

      {/* Yearbook Members Grid */}
      <Card className="bg-[#f5f0e8]/30 dark:bg-[#2a2520]/30 border-[#d4c9b5] backdrop-blur-0 dark:border-[#3d352c]">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            {activeHouse.name}
          </CardTitle>
          <CardDescription>
            Class of {new Date().getFullYear()} · {acceptedMembers.length}{" "}
            member
            {acceptedMembers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YearbookGrid members={acceptedMembers} currentUserId={user?.id} />
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>
              Waiting for {pendingMembers.length} people to accept
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {member.invited_email?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">
                        {member.invited_email}
                      </p>
                      <p className="text-sm text-muted-foreground">Invited</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && <ResendInviteButton memberId={member.id} />}
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
