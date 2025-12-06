"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getHouseStays(houseId: string) {
  const supabase = await createClient();

  const { data: stays, error } = await supabase
    .from("stays")
    .select(`
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `)
    .eq("house_id", houseId)
    .order("check_in", { ascending: true });

  if (error) {
    console.error("Error fetching stays:", error);
    return { stays: [], error: error.message };
  }

  return { stays: stays || [], error: null };
}

export async function createStay(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const houseId = formData.get("house_id") as string;
  const checkIn = formData.get("check_in") as string;
  const checkOut = formData.get("check_out") as string;
  const notes = formData.get("notes") as string | null;

  if (!houseId || !checkIn || !checkOut) {
    return { error: "Missing required fields" };
  }

  // Validate dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkOutDate < checkInDate) {
    return { error: "Check-out must be after check-in" };
  }

  const { data: stay, error } = await supabase
    .from("stays")
    .insert({
      house_id: houseId,
      user_id: user.id,
      check_in: checkIn,
      check_out: checkOut,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating stay:", error);
    return { error: "Failed to create stay" };
  }

  revalidatePath("/dashboard/calendar");
  return { stay, error: null };
}

export async function updateStay(stayId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const checkIn = formData.get("check_in") as string;
  const checkOut = formData.get("check_out") as string;
  const notes = formData.get("notes") as string | null;

  // Validate dates
  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate < checkInDate) {
      return { error: "Check-out must be after check-in" };
    }
  }

  const { error } = await supabase
    .from("stays")
    .update({
      check_in: checkIn,
      check_out: checkOut,
      notes: notes?.trim() || null,
    })
    .eq("id", stayId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating stay:", error);
    return { error: "Failed to update stay" };
  }

  revalidatePath("/dashboard/calendar");
  return { error: null };
}

export async function deleteStay(stayId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("stays")
    .delete()
    .eq("id", stayId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting stay:", error);
    return { error: "Failed to delete stay" };
  }

  revalidatePath("/dashboard/calendar");
  return { error: null };
}

export async function getUpcomingStays(houseId: string, limit = 5) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: stays, error } = await supabase
    .from("stays")
    .select(`
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `)
    .eq("house_id", houseId)
    .gte("check_out", today)
    .order("check_in", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching upcoming stays:", error);
    return { stays: [], error: error.message };
  }

  return { stays: stays || [], error: null };
}
