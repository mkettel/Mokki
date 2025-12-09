"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { RiderType } from "@/types/database";

export async function updateProfile(
  displayName: string,
  riderType?: RiderType | null,
  tagline?: string | null,
  venmoHandle?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate
  if (displayName && displayName.trim().length > 100) {
    return { error: "Name must be 100 characters or less" };
  }

  if (tagline && tagline.trim().length > 100) {
    return { error: "Tagline must be 100 characters or less" };
  }

  // Validate Venmo handle: alphanumeric, hyphens, underscores, 5-30 chars
  if (venmoHandle && venmoHandle.trim().length > 0) {
    const trimmedHandle = venmoHandle.trim();
    if (trimmedHandle.length < 5 || trimmedHandle.length > 30) {
      return { error: "Venmo handle must be 5-30 characters" };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedHandle)) {
      return { error: "Venmo handle can only contain letters, numbers, hyphens, and underscores" };
    }
  }

  const updateData: {
    display_name: string | null;
    rider_type?: RiderType | null;
    tagline?: string | null;
    venmo_handle?: string | null;
  } = {
    display_name: displayName.trim() || null,
  };

  if (riderType !== undefined) {
    updateData.rider_type = riderType;
  }

  if (tagline !== undefined) {
    updateData.tagline = tagline?.trim() || null;
  }

  if (venmoHandle !== undefined) {
    updateData.venmo_handle = venmoHandle?.trim() || null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}
