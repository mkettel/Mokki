"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventWithParticipants } from "@/types/database";

interface Stay {
  id: string;
  check_in: string;
  check_out: string;
  notes: string | null;
  guest_count: number;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
}

interface StaysCalendarProps {
  stays: Stay[];
  events?: EventWithParticipants[];
}

// Generate consistent colors for users based on their ID
function getUserColor(userId: string): string {
  const colors = [
    "bg-blue-300",
    "bg-green-300",
    "bg-violet-300",
    "bg-orange-300",
    "bg-pink-300",
    "bg-teal-300",
    "bg-indigo-300",
    "bg-rose-300",
  ];
  const hash = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function StaysCalendar({ stays, events = [] }: StaysCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the beginning with days from previous month to start on Sunday
  const startDay = monthStart.getDay();
  const paddingDays = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  // Pad the end to complete the week
  const endDay = monthEnd.getDay();
  const endPaddingDays = Array.from({ length: 6 - endDay }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allDays = [...paddingDays, ...days, ...endPaddingDays];

  const getStaysForDay = (date: Date) => {
    return stays.filter((stay) => {
      const checkIn = new Date(stay.check_in);
      const checkOut = new Date(stay.check_out);
      return (
        isWithinInterval(date, { start: checkIn, end: checkOut }) ||
        isSameDay(date, checkIn) ||
        isSameDay(date, checkOut)
      );
    });
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.event_date);
      // For single-day events
      if (!event.end_date) {
        return isSameDay(date, eventDate);
      }
      // For multi-day events
      const endDate = new Date(event.end_date);
      return (
        isWithinInterval(date, { start: eventDate, end: endDate }) ||
        isSameDay(date, eventDate) ||
        isSameDay(date, endDate)
      );
    });
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {allDays.map((date, i) => {
            const dayStays = getStaysForDay(date);
            const dayEvents = getEventsForDay(date);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const totalItems = dayStays.length + dayEvents.length;
            const maxDisplay = 3;

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[80px] border-t border-l p-1",
                  !isCurrentMonth && "bg-muted/30",
                  i % 7 === 6 && "border-r"
                )}
              >
                <div
                  className={cn(
                    "text-sm mb-1",
                    !isCurrentMonth && "text-muted-foreground",
                    isToday(date) &&
                      "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                  )}
                >
                  {format(date, "d")}
                </div>
                <div className="space-y-0.5">
                  {/* Render stays first */}
                  {dayStays.slice(0, maxDisplay).map((stay) => (
                    <div
                      key={stay.id}
                      className={cn(
                        "text-xs px-1 py-0.5 rounded text-black truncate flex items-center gap-0.5",
                        getUserColor(stay.profiles?.id || "unknown")
                      )}
                      title={`${
                        stay.profiles?.display_name || stay.profiles?.email
                      }${stay.guest_count > 0 ? ` (+${stay.guest_count} guest${stay.guest_count !== 1 ? "s" : ""})` : ""}${stay.notes ? `: ${stay.notes}` : ""}`}
                    >
                      <span className="truncate">
                        {stay.profiles?.display_name?.split(" ")[0] ||
                          stay.profiles?.email?.split("@")[0] ||
                          "Unknown"}
                      </span>
                      {stay.guest_count > 0 && (
                        <span className="flex items-center gap-0.5 flex-shrink-0">
                          <Users className="h-2.5 w-2.5" />
                          {stay.guest_count}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* Render events with remaining slots */}
                  {dayEvents
                    .slice(0, Math.max(0, maxDisplay - dayStays.length))
                    .map((event) => (
                      <div
                        key={event.id}
                        className="text-xs px-1 py-0.5 rounded truncate flex items-center gap-0.5 border border-amber-400 bg-amber-50 text-amber-800"
                        title={`${event.name}${event.event_time ? ` at ${formatTime(event.event_time)}` : ""}${event.description ? `: ${event.description}` : ""}`}
                      >
                        <CalendarDays className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{event.name}</span>
                      </div>
                    ))}
                  {totalItems > maxDisplay && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{totalItems - maxDisplay} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {(stays.length > 0 || events.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {Array.from(new Set(stays.map((s) => s.profiles?.id))).map(
            (userId) => {
              const stay = stays.find((s) => s.profiles?.id === userId);
              if (!userId || !stay?.profiles) return null;
              return (
                <div key={userId} className="flex items-center gap-1.5 text-sm">
                  <div
                    className={cn("w-3 h-3 rounded-full", getUserColor(userId))}
                  />
                  <span>
                    {stay.profiles.display_name || stay.profiles.email}
                  </span>
                </div>
              );
            }
          )}
          {events.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-3 h-3 rounded border border-amber-400 bg-amber-50" />
              <span>Events</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
