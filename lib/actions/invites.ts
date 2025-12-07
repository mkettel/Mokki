"use server";

import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email/resend";
import { revalidatePath } from "next/cache";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3003";
};

export async function sendInvite(houseId: string, email: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user's profile for the inviter name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const inviterName = profile?.display_name || profile?.email || "Someone";

  // Get house name
  const { data: house } = await supabase
    .from("houses")
    .select("name")
    .eq("id", houseId)
    .single();

  if (!house) {
    return { error: "House not found" };
  }

  // Check if current user is admin
  const { data: membership } = await supabase
    .from("house_members")
    .select("role")
    .eq("house_id", houseId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role !== "admin") {
    return { error: "Only admins can invite members" };
  }

  // Check if already invited or member
  const { data: existing } = await supabase
    .from("house_members")
    .select("id, invite_status, user_id")
    .eq("house_id", houseId)
    .eq("invited_email", email.toLowerCase().trim())
    .maybeSingle();

  // Check if user exists and is already a member via user_id
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (existingProfile) {
    const { data: existingMember } = await supabase
      .from("house_members")
      .select("id")
      .eq("house_id", houseId)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (existingMember) {
      return { error: "This person is already a member" };
    }

    // User exists but isn't a member - add them directly
    const { error: memberError } = await supabase.from("house_members").insert({
      house_id: houseId,
      user_id: existingProfile.id,
      invited_email: email.toLowerCase().trim(),
      role: "member",
      invite_status: "accepted",
      joined_at: new Date().toISOString(),
    });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return { error: "Failed to add member" };
    }

    revalidatePath("/dashboard/members");
    return { success: true, alreadyUser: true };
  }

  // Create or update invite
  if (existing) {
    // Already has a pending invite - just resend the email
  } else {
    // Create new invite
    const { error: inviteError } = await supabase.from("house_members").insert({
      house_id: houseId,
      invited_email: email.toLowerCase().trim(),
      role: "member",
      invite_status: "pending",
    });

    if (inviteError) {
      console.error("Error creating invite:", inviteError);
      return { error: "Failed to create invite" };
    }
  }

  // Send the email
  const signUpUrl = `${getBaseUrl()}/auth/sign-up?email=${encodeURIComponent(
    email.toLowerCase().trim()
  )}&house=${houseId}`;

  const emailResult = await sendInviteEmail({
    to: email.toLowerCase().trim(),
    houseName: house.name,
    inviterName,
    signUpUrl,
  });

  if (!emailResult.success) {
    console.error("Failed to send invite email:", emailResult.error);
    // Don't fail the whole operation - invite is saved, email just didn't send
    revalidatePath("/dashboard/members");
    return { success: true, emailSent: false };
  }

  revalidatePath("/dashboard/members");
  return { success: true, emailSent: true };
}

export async function resendInvite(memberId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the invite details
  const { data: invite } = await supabase
    .from("house_members")
    .select(
      `
      id,
      house_id,
      invited_email,
      invite_status,
      houses (
        name
      )
    `
    )
    .eq("id", memberId)
    .single();

  if (!invite || !invite.invited_email) {
    return { error: "Invite not found" };
  }

  if (invite.invite_status !== "pending") {
    return { error: "This invite has already been accepted" };
  }

  // Check if current user is admin of this house
  const { data: membership } = await supabase
    .from("house_members")
    .select("role")
    .eq("house_id", invite.house_id)
    .eq("user_id", user.id)
    .single();

  if (membership?.role !== "admin") {
    return { error: "Only admins can resend invites" };
  }

  // Get inviter's name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const inviterName = profile?.display_name || profile?.email || "Someone";
  const houseName = (invite.houses as { name: string })?.name || "a ski house";

  // Send the email
  const signUpUrl = `${getBaseUrl()}/auth/sign-up?email=${encodeURIComponent(
    invite.invited_email
  )}&house=${invite.house_id}`;

  const emailResult = await sendInviteEmail({
    to: invite.invited_email,
    houseName,
    inviterName,
    signUpUrl,
  });

  if (!emailResult.success) {
    return { error: "Failed to send email. Please try again." };
  }

  return { success: true };
}
