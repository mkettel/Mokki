"use client";

import { format, isPast, isToday, isFuture } from "date-fns";
import {
  CalendarDays,
  Trash2,
  ExternalLink,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteEvent } from "@/lib/actions/events";
import { EditEventDialog } from "./edit-event-dialog";
import type { EventWithParticipants, Profile } from "@/types/database";

interface EventsListProps {
  events: EventWithParticipants[];
  currentUserId: string;
  members: Profile[];
  houseId: string;
  title?: string;
  showAll?: boolean;
}

function formatTime(time: string): string {
  // time is in "HH:mm:ss" or "HH:mm" format
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function EventsList({
  events,
  currentUserId,
  members,
  houseId,
  title = "Events",
  showAll = false,
}: EventsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Separate events into categories
  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    return eventDate >= today;
  });

  const pastEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    return eventDate < today;
  });

  const displayEvents = showAll
    ? [...upcomingEvents, ...pastEvents]
    : upcomingEvents.slice(0, 10);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setDeletingId(eventId);

    try {
      const result = await deleteEvent(eventId);
      if (result.error) throw new Error(result.error);
      router.refresh();
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  const getEventStatus = (event: EventWithParticipants) => {
    const eventDate = new Date(event.event_date);

    if (isToday(eventDate)) {
      return { label: "Today", variant: "default" as const };
    }
    if (isFuture(eventDate)) {
      return { label: "Upcoming", variant: "secondary" as const };
    }
    return { label: "Past", variant: "outline" as const };
  };

  if (displayEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No events scheduled yet. Add one to share reservations, activities,
            or arrival times with your housemates!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayEvents.map((event) => {
            const status = getEventStatus(event);
            const isOwner = event.created_by === currentUserId;
            const eventDate = new Date(event.event_date);
            const isPastEvent = isPast(eventDate) && !isToday(eventDate);

            return (
              <div
                key={event.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border border-amber-200 bg-amber-50/50"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{event.name}</span>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{format(eventDate, "MMM d, yyyy")}</span>
                      {event.event_time && (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(event.event_time)}
                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}

                    {/* Links */}
                    {event.links && event.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {event.links.map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {new URL(link).hostname.replace("www.", "")}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Participants */}
                    {event.event_participants &&
                      event.event_participants.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <div className="flex -space-x-1">
                            {event.event_participants.slice(0, 5).map((p) => (
                              <div
                                key={p.id}
                                className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center text-[10px] font-medium"
                                title={
                                  p.profiles?.display_name || p.profiles?.email
                                }
                              >
                                {(
                                  p.profiles?.display_name?.[0] ||
                                  p.profiles?.email?.[0] ||
                                  "?"
                                ).toUpperCase()}
                              </div>
                            ))}
                            {event.event_participants.length > 5 && (
                              <div className="w-5 h-5 rounded-full bg-muted border border-background flex items-center justify-center text-[10px]">
                                +{event.event_participants.length - 5}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {event.event_participants.length} participant
                            {event.event_participants.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                    {/* Created by */}
                    <p className="text-xs text-muted-foreground mt-1">
                      Added by{" "}
                      {event.profiles?.display_name || event.profiles?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isOwner && !isPastEvent && (
                    <>
                      <EditEventDialog
                        event={event}
                        members={members}
                        houseId={houseId}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
