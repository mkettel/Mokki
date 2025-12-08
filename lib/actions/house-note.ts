"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { HouseNoteWithEditor } from "@/types/database";

export async function getHouseNote(houseId: string): Promise<{
  note: HouseNoteWithEditor | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: note, error } = await supabase
    .from("house_notes")
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
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found (that's ok, note doesn't exist yet)
    console.error("Error fetching house note:", error);
    return { note: null, error: error.message };
  }

  return { note: note as HouseNoteWithEditor | null, error: null };
}

export async function updateHouseNote(
  houseId: string,
  content: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Use upsert to create or update the note
  const { error } = await supabase.from("house_notes").upsert(
    {
      house_id: houseId,
      content: content,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "house_id",
    }
  );

  if (error) {
    console.error("Error updating house note:", error);
    return { error: "Failed to update note" };
  }

  revalidatePath("/dashboard/bulletin-board");
  return { error: null };
}
