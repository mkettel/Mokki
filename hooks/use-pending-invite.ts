"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface PendingInvite {
  houseId: string;
  email: string;
}

export function usePendingInvite() {
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function processInvite() {
      const stored = localStorage.getItem("pending_house_invite");
      if (!stored) return;

      try {
        const invite: PendingInvite = JSON.parse(stored);
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return;

        // Verify the email matches
        if (user.email.toLowerCase().trim() !== invite.email) {
          // Different user logged in, clear the stored invite
          localStorage.removeItem("pending_house_invite");
          return;
        }

        setProcessing(true);

        // Find and accept the invite
        const { data: pendingInvite } = await supabase
          .from("house_members")
          .select("id")
          .eq("house_id", invite.houseId)
          .eq("invited_email", invite.email)
          .eq("invite_status", "pending")
          .maybeSingle();

        if (pendingInvite) {
          const { error: updateError } = await supabase
            .from("house_members")
            .update({
              user_id: user.id,
              invite_status: "accepted",
              joined_at: new Date().toISOString(),
            })
            .eq("id", pendingInvite.id);

          if (updateError) {
            console.error("Error accepting invite:", updateError);
          }
        } else {
          console.log("No pending invite found for:", invite.email, invite.houseId);
        }

        // Clear the stored invite
        localStorage.removeItem("pending_house_invite");

        // Redirect to dashboard to show the joined house
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        console.error("Error processing pending invite:", err);
      } finally {
        setProcessing(false);
      }
    }

    processInvite();
  }, [router]);

  return { processing };
}
