"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { RiderType } from "@/types/database";

export async function updateProfile(displayName: string, riderType?: RiderType | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate
  if (displayName && displayName.trim().length > 100) {
    return { error: "Name must be 100 characters or less" };
  }

  const updateData: { display_name: string | null; rider_type?: RiderType | null } = {
    display_name: displayName.trim() || null,
  };

  if (riderType !== undefined) {
    updateData.rider_type = riderType;
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
  revalidatePath("/dashboard");
  return { success: true };
}
