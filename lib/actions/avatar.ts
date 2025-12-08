"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("avatar") as File;

  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  // Server-side validation
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File too large (max 5MB)" };
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${user.id}/avatar.${fileExt}`;

  console.log("Upload attempt:", { userId: user.id, filePath, fileSize: file.size });

  // Delete existing avatars first (clean up any previous uploads)
  const { data: existingFiles } = await supabase.storage
    .from("avatars")
    .list(user.id);

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from("avatars").remove(filesToDelete);
  }

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "Failed to upload image" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update profile with new avatar URL (with cache-busting timestamp)
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("Profile update error:", updateError);
    return { error: "Failed to update profile" };
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");

  return { success: true, avatarUrl };
}

export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // List and remove all files in user's folder
  const { data: existingFiles } = await supabase.storage
    .from("avatars")
    .list(user.id);

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from("avatars").remove(filesToDelete);
  }

  // Clear avatar_url in profile
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to remove avatar" };
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");

  return { success: true };
}
