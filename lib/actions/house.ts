"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createHouse(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create a house" };
  }

  const name = formData.get("name") as string;
  const address = formData.get("address") as string | null;

  if (!name || name.trim().length === 0) {
    return { error: "House name is required" };
  }

  // Create the house
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .insert({
      name: name.trim(),
      address: address?.trim() || null,
      settings: {},
    })
    .select()
    .single();

  if (houseError) {
    console.error("Error creating house:", houseError);
    return { error: "Failed to create house" };
  }

  // Add the creator as an admin member
  const { error: memberError } = await supabase.from("house_members").insert({
    house_id: house.id,
    user_id: user.id,
    role: "admin",
    invite_status: "accepted",
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    console.error("Error adding member:", memberError);
    // Clean up the house if we couldn't add the member
    await supabase.from("houses").delete().eq("id", house.id);
    return { error: "Failed to set up house membership" };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard`);
}

export async function getUserHouses() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { houses: [], error: "Not authenticated" };
  }

  const { data: memberships, error } = await supabase
    .from("house_members")
    .select(`
      house_id,
      role,
      invite_status,
      houses (
        id,
        name,
        address,
        settings
      )
    `)
    .eq("user_id", user.id)
    .eq("invite_status", "accepted");

  if (error) {
    console.error("Error fetching houses:", error);
    return { houses: [], error: "Failed to fetch houses" };
  }

  const houses = memberships
    ?.map((m) => ({
      ...m.houses,
      role: m.role,
    }))
    .filter((h) => h.id); // Filter out any null houses

  return { houses: houses || [], error: null };
}

type HouseMemberWithProfile = {
  id: string;
  role: string;
  invite_status: string;
  invited_email: string | null;
  joined_at: string | null;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function getHouseWithMembers(houseId: string): Promise<{
  house: { id: string; name: string; address: string | null; settings: unknown } | null;
  members: HouseMemberWithProfile[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { house: null, members: [] as HouseMemberWithProfile[], error: "Not authenticated" };
  }

  // Get house details
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .select("*")
    .eq("id", houseId)
    .single();

  if (houseError) {
    return { house: null, members: [] as HouseMemberWithProfile[], error: "House not found" };
  }

  // Get members with their profiles
  const { data: members, error: membersError } = await supabase
    .from("house_members")
    .select(`
      id,
      role,
      invite_status,
      invited_email,
      joined_at,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `)
    .eq("house_id", houseId);

  if (membersError) {
    console.error("Error fetching members:", membersError);
  }

  return {
    house,
    members: (members || []) as HouseMemberWithProfile[],
    error: null,
  };
}

export async function inviteMember(houseId: string, email: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
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

  // Check if user is already a member or invited
  const { data: existing } = await supabase
    .from("house_members")
    .select("id, invite_status")
    .eq("house_id", houseId)
    .or(`invited_email.eq.${email},profiles.email.eq.${email}`)
    .maybeSingle();

  if (existing) {
    return { error: "This person is already a member or has been invited" };
  }

  // Check if user already has an account
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  // Create the invite
  const { error: inviteError } = await supabase.from("house_members").insert({
    house_id: houseId,
    user_id: existingProfile?.id || null,
    invited_email: email,
    role: "member",
    invite_status: existingProfile ? "accepted" : "pending",
    joined_at: existingProfile ? new Date().toISOString() : null,
  });

  if (inviteError) {
    console.error("Error creating invite:", inviteError);
    return { error: "Failed to send invite" };
  }

  revalidatePath(`/dashboard`);
  return { success: true };
}

export async function acceptInvite(houseId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user's email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  // Find pending invite
  const { data: invite } = await supabase
    .from("house_members")
    .select("id")
    .eq("house_id", houseId)
    .eq("invited_email", profile.email)
    .eq("invite_status", "pending")
    .single();

  if (!invite) {
    return { error: "No pending invite found" };
  }

  // Accept the invite
  const { error: updateError } = await supabase
    .from("house_members")
    .update({
      user_id: user.id,
      invite_status: "accepted",
      joined_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (updateError) {
    console.error("Error accepting invite:", updateError);
    return { error: "Failed to accept invite" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPendingInvites() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { invites: [] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { invites: [] };
  }

  const { data: invites } = await supabase
    .from("house_members")
    .select(`
      id,
      house_id,
      houses (
        id,
        name
      )
    `)
    .eq("invited_email", profile.email)
    .eq("invite_status", "pending");

  return { invites: invites || [] };
}
