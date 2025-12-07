"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BulletinCategory, BulletinItemWithProfile } from "@/types/database";

export async function getBulletinItems(houseId: string): Promise<{
  items: BulletinItemWithProfile[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("bulletin_items")
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bulletin items:", error);
    return { items: [], error: error.message };
  }

  return { items: items as BulletinItemWithProfile[], error: null };
}

export async function createBulletinItem(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const houseId = formData.get("house_id") as string;
  const category = formData.get("category") as BulletinCategory | null;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const color = (formData.get("color") as string) || "yellow";

  if (!houseId || !title || !content) {
    return { error: "Missing required fields" };
  }

  const { data: item, error } = await supabase
    .from("bulletin_items")
    .insert({
      house_id: houseId,
      category: category || null,
      title: title.trim(),
      content: content.trim(),
      color,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating bulletin item:", error);
    return { error: "Failed to create note" };
  }

  revalidatePath("/dashboard/bulletin-board");
  return { item, error: null };
}

export async function updateBulletinItem(itemId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const category = formData.get("category") as BulletinCategory | null;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const color = formData.get("color") as string;

  if (!title || !content) {
    return { error: "Title and content are required" };
  }

  const { error } = await supabase
    .from("bulletin_items")
    .update({
      category: category || null,
      title: title.trim(),
      content: content.trim(),
      color,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    console.error("Error updating bulletin item:", error);
    return { error: "Failed to update note" };
  }

  revalidatePath("/dashboard/bulletin-board");
  return { error: null };
}

export async function deleteBulletinItem(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("bulletin_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting bulletin item:", error);
    return { error: "Failed to delete note" };
  }

  revalidatePath("/dashboard/bulletin-board");
  return { error: null };
}
