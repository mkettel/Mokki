"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(displayName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate
  if (displayName && displayName.trim().length > 100) {
    return { error: "Name must be 100 characters or less" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName.trim() || null })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
