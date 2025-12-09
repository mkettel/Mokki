"use client";

import { motion } from "framer-motion";
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
import { CancelInviteButton } from "./cancel-invite-button";
import { YearbookGrid } from "./yearbook-grid";

interface Member {
  id: string;
  invite_status: string;
  invited_email: string | null;
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    rider_type: string | null;
    tagline: string | null;
  } | null;
  role: string;
}

interface MembersContentProps {
  houseName: string;
  houseId: string;
  acceptedMembers: Member[];
  pendingMembers: Member[];
  currentUserId: string | undefined;
  isAdmin: boolean;
}

export function MembersContent({
  houseName,
  houseId,
  acceptedMembers,
  pendingMembers,
  currentUserId,
  isAdmin,
}: MembersContentProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl text-red uppercase font-bold">Members</h1>
        <p className="text-muted-foreground">
          Manage who has access to {houseName}
        </p>
      </motion.div>

      {/* Invite Form - Only for admins */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Invite New Member</CardTitle>
              <CardDescription>
                Send an invite to add someone to your house
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteMemberForm houseId={houseId} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Yearbook Members Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: isAdmin ? 0.2 : 0.1, ease: "easeOut" }}
      >
        <Card className="bg-[#f5f0e8]/30 dark:bg-[#2a2520]/30 border-[#d4c9b5] backdrop-blur-0 dark:border-[#3d352c]">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              {houseName}
            </CardTitle>
            <CardDescription>
              Class of {new Date().getFullYear()} · {acceptedMembers.length}{" "}
              member
              {acceptedMembers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <YearbookGrid members={acceptedMembers} currentUserId={currentUserId} isAdmin={isAdmin} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Invites */}
      {pendingMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: isAdmin ? 0.3 : 0.2, ease: "easeOut" }}
        >
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
                    className="flex items-center flex-wrap justify-between"
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
                      {isAdmin && (
                        <>
                          <ResendInviteButton memberId={member.id} />
                          <CancelInviteButton memberId={member.id} />
                        </>
                      )}
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
