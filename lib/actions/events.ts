"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EventWithParticipants, Profile } from "@/types/database";

// Type for event with participant details
export type EventWithDetails = EventWithParticipants;

// Get all events for a house
export async function getHouseEvents(houseId: string): Promise<{
  events: EventWithDetails[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      ),
      event_participants (
        id,
        user_id,
        created_at,
        profiles (
          id,
          email,
          display_name,
          avatar_url
        )
      )
    `
    )
    .eq("house_id", houseId)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching events:", error);
    return { events: [], error: error.message };
  }

  return { events: (events || []) as EventWithDetails[], error: null };
}

// Create a new event
export async function createEvent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const houseId = formData.get("house_id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const eventDate = formData.get("event_date") as string;
  const eventTime = formData.get("event_time") as string | null;
  const endDate = formData.get("end_date") as string | null;
  const endTime = formData.get("end_time") as string | null;
  const linksJson = formData.get("links") as string | null;
  const participantsJson = formData.get("participants") as string | null;

  // Validation
  if (!houseId || !name || !eventDate) {
    return { error: "Missing required fields" };
  }

  // Parse links array
  let links: string[] | null = null;
  if (linksJson) {
    try {
      const parsed = JSON.parse(linksJson);
      // Filter out empty strings
      const filtered = parsed.filter((l: string) => l.trim().length > 0);
      links = filtered.length > 0 ? filtered : null;
    } catch {
      return { error: "Invalid links format" };
    }
  }

  // Parse participants array
  let participants: string[] = [];
  if (participantsJson) {
    try {
      participants = JSON.parse(participantsJson);
    } catch {
      return { error: "Invalid participants format" };
    }
  }

  // Create the event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      house_id: houseId,
      created_by: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      event_date: eventDate,
      event_time: eventTime || null,
      end_date: endDate || null,
      end_time: endTime || null,
      links,
    })
    .select()
    .single();

  if (eventError) {
    console.error("Error creating event:", eventError);
    return { error: "Failed to create event" };
  }

  // Add participants
  if (participants.length > 0) {
    const participantInserts = participants.map((userId) => ({
      event_id: event.id,
      user_id: userId,
    }));

    const { error: participantsError } = await supabase
      .from("event_participants")
      .insert(participantInserts);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      // Don't fail the whole operation, just log
    }
  }

  revalidatePath("/dashboard/calendar");
  return { event, error: null };
}

// Update an event
export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const eventDate = formData.get("event_date") as string;
  const eventTime = formData.get("event_time") as string | null;
  const endDate = formData.get("end_date") as string | null;
  const endTime = formData.get("end_time") as string | null;
  const linksJson = formData.get("links") as string | null;
  const participantsJson = formData.get("participants") as string | null;

  // Parse links
  let links: string[] | null = null;
  if (linksJson) {
    try {
      const parsed = JSON.parse(linksJson);
      const filtered = parsed.filter((l: string) => l.trim().length > 0);
      links = filtered.length > 0 ? filtered : null;
    } catch {
      return { error: "Invalid links format" };
    }
  }

  // Update event
  const { error: updateError } = await supabase
    .from("events")
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      event_date: eventDate,
      event_time: eventTime || null,
      end_date: endDate || null,
      end_time: endTime || null,
      links,
    })
    .eq("id", eventId)
    .eq("created_by", user.id);

  if (updateError) {
    console.error("Error updating event:", updateError);
    return { error: "Failed to update event" };
  }

  // Update participants if provided
  if (participantsJson !== null) {
    const participants: string[] = JSON.parse(participantsJson);

    // Delete existing participants and re-add
    await supabase.from("event_participants").delete().eq("event_id", eventId);

    if (participants.length > 0) {
      const participantInserts = participants.map((userId) => ({
        event_id: eventId,
        user_id: userId,
      }));

      await supabase.from("event_participants").insert(participantInserts);
    }
  }

  revalidatePath("/dashboard/calendar");
  return { error: null };
}

// Delete an event
export async function deleteEvent(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("created_by", user.id);

  if (error) {
    console.error("Error deleting event:", error);
    return { error: "Failed to delete event" };
  }

  revalidatePath("/dashboard/calendar");
  return { error: null };
}

// Get a single event with all details
export async function getEvent(eventId: string): Promise<{
  event: EventWithDetails | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(
      `
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      ),
      event_participants (
        id,
        user_id,
        created_at,
        profiles (
          id,
          email,
          display_name,
          avatar_url
        )
      )
    `
    )
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    return { event: null, error: error.message };
  }

  return { event: event as EventWithDetails, error: null };
}

// Get upcoming events for a house (useful for dashboard widgets)
export async function getUpcomingEvents(
  houseId: string,
  limit = 5
): Promise<{
  events: EventWithDetails[];
  error: string | null;
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      ),
      event_participants (
        id,
        user_id,
        created_at,
        profiles (
          id,
          email,
          display_name,
          avatar_url
        )
      )
    `
    )
    .eq("house_id", houseId)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching upcoming events:", error);
    return { events: [], error: error.message };
  }

  return { events: (events || []) as EventWithDetails[], error: null };
}

// Get house members for participant selection
export async function getHouseMembersForEvents(houseId: string): Promise<{
  members: Profile[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("house_members")
    .select(
      `
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `
    )
    .eq("house_id", houseId)
    .eq("invite_status", "accepted")
    .not("user_id", "is", null);

  if (error) {
    console.error("Error fetching house members:", error);
    return { members: [], error: error.message };
  }

  // Extract profiles from the response
  const profiles = (members || [])
    .map((m) => m.profiles)
    .filter((p): p is Profile => p !== null);

  return { members: profiles, error: null };
}
