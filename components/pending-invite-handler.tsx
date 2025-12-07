"use client";

import { usePendingInvite } from "@/hooks/use-pending-invite";

export function PendingInviteHandler() {
  usePendingInvite();
  return null;
}
