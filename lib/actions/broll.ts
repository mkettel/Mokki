"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  BRollMedia,
  BRollMediaWithProfile,
  BRollMediaGroupedByDay,
  MediaType,
} from "@/types/database";
import { format, isToday, isYesterday } from "date-fns";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ITEMS_PER_PAGE = 20;

function getMediaType(mimeType: string): MediaType | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return "video";
  return null;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function groupByDay(items: BRollMediaWithProfile[]): BRollMediaGroupedByDay[] {
  const groups: Map<string, BRollMediaWithProfile[]> = new Map();

  for (const item of items) {
    const date = format(new Date(item.created_at), "yyyy-MM-dd");
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(item);
  }

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    displayDate: formatDisplayDate(date),
    items,
  }));
}

export async function getBRollMedia(
  houseId: string,
  options?: { limit?: number; offset?: number }
): Promise<{
  items: BRollMediaWithProfile[];
  grouped: BRollMediaGroupedByDay[];
  hasMore: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const limit = options?.limit ?? ITEMS_PER_PAGE;
  const offset = options?.offset ?? 0;

  const { data: items, error } = await supabase
    .from("b_roll_media")
    .select(
      `
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `
    )
    .eq("house_id", houseId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    console.error("Error fetching b-roll media:", error);
    return { items: [], grouped: [], hasMore: false, error: error.message };
  }

  const typedItems = items as BRollMediaWithProfile[];
  const grouped = groupByDay(typedItems);
  const hasMore = items.length > limit;

  return {
    items: typedItems.slice(0, limit),
    grouped,
    hasMore,
    error: null,
  };
}

export async function uploadBRollMedia(formData: FormData): Promise<{
  items: BRollMedia[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { items: [], error: "Not authenticated" };
  }

  const houseId = formData.get("house_id") as string;
  if (!houseId) {
    return { items: [], error: "House ID is required" };
  }

  // Verify user is a member of this house
  const { data: membership } = await supabase
    .from("house_members")
    .select("id")
    .eq("house_id", houseId)
    .eq("user_id", user.id)
    .eq("invite_status", "accepted")
    .single();

  if (!membership) {
    return { items: [], error: "You are not a member of this house" };
  }

  const files = formData.getAll("files") as File[];
  const captions = formData.getAll("captions") as string[];
  const widths = formData.getAll("widths") as string[];
  const heights = formData.getAll("heights") as string[];
  const durations = formData.getAll("durations") as string[];

  if (files.length === 0) {
    return { items: [], error: "No files provided" };
  }

  // Pre-validate all files and prepare upload tasks
  const validationErrors: string[] = [];
  const uploadTasks: Array<{
    file: File;
    caption: string | null;
    width: number | null;
    height: number | null;
    duration: number | null;
    mediaType: MediaType;
    storagePath: string;
  }> = [];

  const baseTimestamp = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const caption = captions[i] || null;
    const width = widths[i] ? parseInt(widths[i]) : null;
    const height = heights[i] ? parseInt(heights[i]) : null;
    const duration = durations[i] ? parseInt(durations[i]) : null;

    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      validationErrors.push(`${file.name}: Unsupported file type`);
      continue;
    }

    const maxSize = mediaType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      const sizeLabel = mediaType === "image" ? "10MB" : "100MB";
      validationErrors.push(`${file.name}: File too large (max ${sizeLabel})`);
      continue;
    }

    // Use base timestamp + index to ensure unique paths
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${houseId}/${user.id}/${baseTimestamp}_${i}_${sanitizedFileName}`;

    uploadTasks.push({
      file,
      caption,
      width,
      height,
      duration,
      mediaType,
      storagePath,
    });
  }

  if (uploadTasks.length === 0) {
    return { items: [], error: validationErrors.join("; ") };
  }

  // Upload all files in parallel
  const uploadResults = await Promise.allSettled(
    uploadTasks.map(async (task) => {
      const { error: uploadError } = await supabase.storage
        .from("broll")
        .upload(task.storagePath, task.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`${task.file.name}: Upload failed`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("broll").getPublicUrl(task.storagePath);

      const { data: insertedItem, error: insertError } = await supabase
        .from("b_roll_media")
        .insert({
          house_id: houseId,
          uploaded_by: user.id,
          media_type: task.mediaType,
          storage_path: task.storagePath,
          public_url: publicUrl,
          caption: task.caption?.trim() || null,
          file_name: task.file.name,
          file_size: task.file.size,
          mime_type: task.file.type,
          width: task.width,
          height: task.height,
          duration: task.duration,
        })
        .select()
        .single();

      if (insertError) {
        // Clean up uploaded file if DB insert fails
        await supabase.storage.from("broll").remove([task.storagePath]);
        throw new Error(`${task.file.name}: Failed to save to database`);
      }

      return insertedItem;
    })
  );

  // Collect results and errors
  const uploadedItems: BRollMedia[] = [];
  const uploadErrors: string[] = [...validationErrors];

  for (const result of uploadResults) {
    if (result.status === "fulfilled") {
      uploadedItems.push(result.value);
    } else {
      uploadErrors.push(result.reason?.message || "Unknown upload error");
    }
  }

  revalidatePath("/dashboard/b-roll");

  if (uploadErrors.length > 0 && uploadedItems.length === 0) {
    return { items: [], error: uploadErrors.join("; ") };
  }

  return {
    items: uploadedItems,
    error: uploadErrors.length > 0 ? `Some files failed: ${uploadErrors.join("; ")}` : null,
  };
}

export async function updateBRollCaption(
  mediaId: string,
  caption: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("b_roll_media")
    .update({
      caption: caption.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId)
    .eq("uploaded_by", user.id);

  if (error) {
    console.error("Error updating caption:", error);
    return { error: "Failed to update caption" };
  }

  revalidatePath("/dashboard/b-roll");
  return { error: null };
}

export async function deleteBRollMedia(
  mediaId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: media, error: fetchError } = await supabase
    .from("b_roll_media")
    .select("storage_path")
    .eq("id", mediaId)
    .eq("uploaded_by", user.id)
    .single();

  if (fetchError || !media) {
    return { error: "Media not found or you don't have permission to delete it" };
  }

  const { error: storageError } = await supabase.storage
    .from("broll")
    .remove([media.storage_path]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
  }

  const { error: deleteError } = await supabase
    .from("b_roll_media")
    .delete()
    .eq("id", mediaId);

  if (deleteError) {
    console.error("Database delete error:", deleteError);
    return { error: "Failed to delete media" };
  }

  revalidatePath("/dashboard/b-roll");
  return { error: null };
}
