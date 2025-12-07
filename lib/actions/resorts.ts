"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resort, WebcamConfig } from "@/types/database";

// Helper to check if user is admin of any house
async function isUserHouseAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("house_members")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .eq("invite_status", "accepted")
    .limit(1)
    .maybeSingle();

  return !!data;
}

// Generate a URL-friendly slug from resort name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function getResorts(): Promise<{
  resorts: Resort[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: resorts, error } = await supabase
    .from("resorts")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching resorts:", error);
    return { resorts: [], error: error.message };
  }

  return { resorts: resorts as Resort[], error: null };
}

export async function getResort(resortId: string): Promise<{
  resort: Resort | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: resort, error } = await supabase
    .from("resorts")
    .select("*")
    .eq("id", resortId)
    .single();

  if (error) {
    return { resort: null, error: error.message };
  }

  return { resort: resort as Resort, error: null };
}

export async function getResortBySlug(slug: string): Promise<{
  resort: Resort | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: resort, error } = await supabase
    .from("resorts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return { resort: null, error: error.message };
  }

  return { resort: resort as Resort, error: null };
}

export async function updateHouseResort(
  houseId: string,
  resortId: string | null
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin of this house
  const { data: membership } = await supabase
    .from("house_members")
    .select("role")
    .eq("house_id", houseId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role !== "admin") {
    return { error: "Only admins can update house settings" };
  }

  const { error } = await supabase
    .from("houses")
    .update({ resort_id: resortId })
    .eq("id", houseId);

  if (error) {
    console.error("Error updating house resort:", error);
    return { error: "Failed to update resort" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/snow-report");
  return { error: null };
}

export async function updateHouseFavoriteResorts(
  houseId: string,
  resortIds: string[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin of this house
  const { data: membership } = await supabase
    .from("house_members")
    .select("role")
    .eq("house_id", houseId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role !== "admin") {
    return { error: "Only admins can update house settings" };
  }

  const { error } = await supabase
    .from("houses")
    .update({ favorite_resort_ids: resortIds })
    .eq("id", houseId);

  if (error) {
    console.error("Error updating favorite resorts:", error);
    return { error: "Failed to update favorite resorts" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/snow-report");
  return { error: null };
}

export async function getResortsByIds(resortIds: string[]): Promise<{
  resorts: Resort[];
  error: string | null;
}> {
  if (resortIds.length === 0) {
    return { resorts: [], error: null };
  }

  const supabase = await createClient();

  const { data: resorts, error } = await supabase
    .from("resorts")
    .select("*")
    .in("id", resortIds);

  if (error) {
    console.error("Error fetching resorts by ids:", error);
    return { resorts: [], error: error.message };
  }

  return { resorts: resorts as Resort[], error: null };
}

// Resort CRUD operations

export interface CreateResortInput {
  name: string;
  latitude: number;
  longitude: number;
  elevation_base?: number;
  elevation_summit?: number;
  timezone?: string;
  website_url?: string;
  webcam_urls?: WebcamConfig[];
}

export async function createResort(input: CreateResortInput): Promise<{
  resort: Resort | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { resort: null, error: "Not authenticated" };
  }

  // Check if user is admin of any house
  const isAdmin = await isUserHouseAdmin(supabase, user.id);
  if (!isAdmin) {
    return { resort: null, error: "Only house admins can create resorts" };
  }

  // Validate inputs
  if (!input.name || input.name.trim().length === 0) {
    return { resort: null, error: "Resort name is required" };
  }
  if (input.latitude < -90 || input.latitude > 90) {
    return { resort: null, error: "Invalid latitude" };
  }
  if (input.longitude < -180 || input.longitude > 180) {
    return { resort: null, error: "Invalid longitude" };
  }

  const slug = generateSlug(input.name);

  // Check for duplicate slug
  const { data: existing } = await supabase
    .from("resorts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { resort: null, error: "A resort with this name already exists" };
  }

  const { data: resort, error } = await supabase
    .from("resorts")
    .insert({
      name: input.name.trim(),
      slug,
      latitude: input.latitude,
      longitude: input.longitude,
      elevation_base: input.elevation_base || null,
      elevation_summit: input.elevation_summit || null,
      timezone: input.timezone || "America/Los_Angeles",
      website_url: input.website_url || null,
      webcam_urls: input.webcam_urls || [],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating resort:", error);
    return { resort: null, error: "Failed to create resort" };
  }

  revalidatePath("/dashboard/snow-report");
  return { resort: resort as Resort, error: null };
}

export interface UpdateResortInput {
  name?: string;
  latitude?: number;
  longitude?: number;
  elevation_base?: number | null;
  elevation_summit?: number | null;
  timezone?: string;
  website_url?: string | null;
  webcam_urls?: WebcamConfig[];
}

export async function updateResort(
  resortId: string,
  input: UpdateResortInput
): Promise<{
  resort: Resort | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { resort: null, error: "Not authenticated" };
  }

  // Check if user is admin of any house
  const isAdmin = await isUserHouseAdmin(supabase, user.id);
  if (!isAdmin) {
    return { resort: null, error: "Only house admins can update resorts" };
  }

  // Validate inputs if provided
  if (input.latitude !== undefined && (input.latitude < -90 || input.latitude > 90)) {
    return { resort: null, error: "Invalid latitude" };
  }
  if (input.longitude !== undefined && (input.longitude < -180 || input.longitude > 180)) {
    return { resort: null, error: "Invalid longitude" };
  }

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      return { resort: null, error: "Resort name cannot be empty" };
    }
    const newName = input.name.trim();
    const newSlug = generateSlug(input.name);
    updateData.name = newName;
    updateData.slug = newSlug;

    // Check for duplicate slug (excluding current resort)
    const { data: existing } = await supabase
      .from("resorts")
      .select("id")
      .eq("slug", newSlug)
      .neq("id", resortId)
      .maybeSingle();

    if (existing) {
      return { resort: null, error: "A resort with this name already exists" };
    }
  }

  if (input.latitude !== undefined) updateData.latitude = input.latitude;
  if (input.longitude !== undefined) updateData.longitude = input.longitude;
  if (input.elevation_base !== undefined) updateData.elevation_base = input.elevation_base;
  if (input.elevation_summit !== undefined) updateData.elevation_summit = input.elevation_summit;
  if (input.timezone !== undefined) updateData.timezone = input.timezone;
  if (input.website_url !== undefined) updateData.website_url = input.website_url;
  if (input.webcam_urls !== undefined) updateData.webcam_urls = input.webcam_urls;

  updateData.updated_at = new Date().toISOString();

  const { data: resort, error } = await supabase
    .from("resorts")
    .update(updateData)
    .eq("id", resortId)
    .select()
    .single();

  if (error) {
    console.error("Error updating resort:", error);
    return { resort: null, error: "Failed to update resort" };
  }

  revalidatePath("/dashboard/snow-report");
  return { resort: resort as Resort, error: null };
}

export async function deleteResort(resortId: string): Promise<{
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is admin of any house
  const isAdmin = await isUserHouseAdmin(supabase, user.id);
  if (!isAdmin) {
    return { error: "Only house admins can delete resorts" };
  }

  // Check if any houses are using this resort
  const { count: houseCount } = await supabase
    .from("houses")
    .select("*", { count: "exact", head: true })
    .eq("resort_id", resortId);

  if (houseCount && houseCount > 0) {
    return { error: "Cannot delete resort that is set as primary for houses" };
  }

  // Remove from favorite_resort_ids arrays
  // Note: This requires updating houses that have this resort in their favorites
  const { data: housesWithFavorite } = await supabase
    .from("houses")
    .select("id, favorite_resort_ids")
    .contains("favorite_resort_ids", [resortId]);

  if (housesWithFavorite && housesWithFavorite.length > 0) {
    for (const house of housesWithFavorite) {
      const updatedFavorites = (house.favorite_resort_ids || []).filter(
        (id: string) => id !== resortId
      );
      await supabase
        .from("houses")
        .update({ favorite_resort_ids: updatedFavorites })
        .eq("id", house.id);
    }
  }

  const { error } = await supabase
    .from("resorts")
    .delete()
    .eq("id", resortId);

  if (error) {
    console.error("Error deleting resort:", error);
    return { error: "Failed to delete resort" };
  }

  revalidatePath("/dashboard/snow-report");
  return { error: null };
}
