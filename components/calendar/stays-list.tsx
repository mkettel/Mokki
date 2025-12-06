"use client";

import { format, isPast, isToday, isFuture } from "date-fns";
import { Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Stay {
  id: string;
  check_in: string;
  check_out: string;
  notes: string | null;
  user_id: string;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
}

interface StaysListProps {
  stays: Stay[];
  currentUserId: string;
  title?: string;
  showAll?: boolean;
}

export function StaysList({ stays, currentUserId, title = "Stays", showAll = false }: StaysListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date();

  // Separate stays into categories
  const currentStays = stays.filter((stay) => {
    const checkIn = new Date(stay.check_in);
    const checkOut = new Date(stay.check_out);
    return checkIn <= now && checkOut >= now;
  });

  const upcomingStays = stays.filter((stay) => {
    const checkIn = new Date(stay.check_in);
    return checkIn > now;
  });

  const pastStays = stays.filter((stay) => {
    const checkOut = new Date(stay.check_out);
    return checkOut < now;
  });

  const displayStays = showAll ? stays : [...currentStays, ...upcomingStays].slice(0, 10);

  const handleDelete = async (stayId: string) => {
    if (!confirm("Are you sure you want to delete this stay?")) return;

    setDeletingId(stayId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("stays")
        .delete()
        .eq("id", stayId);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error("Error deleting stay:", err);
      alert("Failed to delete stay");
    } finally {
      setDeletingId(null);
    }
  };

  const getStayStatus = (stay: Stay) => {
    const checkIn = new Date(stay.check_in);
    const checkOut = new Date(stay.check_out);

    if (checkIn <= now && checkOut >= now) {
      return { label: "Current", variant: "default" as const };
    }
    if (isToday(checkIn)) {
      return { label: "Today", variant: "default" as const };
    }
    if (isFuture(checkIn)) {
      return { label: "Upcoming", variant: "secondary" as const };
    }
    return { label: "Past", variant: "outline" as const };
  };

  if (displayStays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No stays scheduled yet. Add one to let everyone know when you&apos;ll be at the house!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayStays.map((stay) => {
            const status = getStayStatus(stay);
            const isOwner = stay.user_id === currentUserId;
            const checkIn = new Date(stay.check_in);
            const checkOut = new Date(stay.check_out);

            return (
              <div
                key={stay.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">
                      {stay.profiles?.display_name?.[0]?.toUpperCase() ||
                        stay.profiles?.email?.[0]?.toUpperCase() ||
                        "?"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {stay.profiles?.display_name || stay.profiles?.email}
                      </span>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(checkIn, "MMM d")} - {format(checkOut, "MMM d, yyyy")}
                    </p>
                    {stay.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {stay.notes}
                      </p>
                    )}
                  </div>
                </div>
                {isOwner && !isPast(checkOut) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(stay.id)}
                    disabled={deletingId === stay.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
