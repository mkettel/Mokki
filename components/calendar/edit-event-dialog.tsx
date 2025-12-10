"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import {
  CalendarIcon,
  Plus,
  X,
  Link as LinkIcon,
  Pencil,
} from "lucide-react";
import { updateEvent } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { EventWithParticipants, Profile } from "@/types/database";

interface EditEventDialogProps {
  event: EventWithParticipants;
  members: Profile[];
  houseId: string;
  trigger?: React.ReactNode;
}

export function EditEventDialog({
  event,
  members,
  houseId,
  trigger,
}: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description || "");
  const [eventDate, setEventDate] = useState<Date>(new Date(event.event_date));
  const [eventTime, setEventTime] = useState(event.event_time || "");
  const [endTime, setEndTime] = useState(event.end_time || "");
  const [links, setLinks] = useState<string[]>(
    event.links && event.links.length > 0 ? event.links : [""]
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    event.event_participants?.map((p) => p.user_id) || []
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(event.name);
      setDescription(event.description || "");
      setEventDate(new Date(event.event_date));
      setEventTime(event.event_time || "");
      setEndTime(event.end_time || "");
      setLinks(event.links && event.links.length > 0 ? event.links : [""]);
      setSelectedParticipants(
        event.event_participants?.map((p) => p.user_id) || []
      );
      setError(null);
    }
  }, [open, event]);

  // Check if event is in the past
  const eventPast =
    isPast(new Date(event.event_date)) && !isToday(new Date(event.event_date));

  const handleAddLink = () => {
    setLinks([...links, ""]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("Please enter an event name");
      setIsLoading(false);
      return;
    }

    if (!eventDate) {
      setError("Please select a date");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("event_date", format(eventDate, "yyyy-MM-dd"));

      if (eventTime) {
        formData.append("event_time", eventTime);
      }
      if (endTime) {
        formData.append("end_time", endTime);
      }

      // Filter out empty links
      const validLinks = links.filter((l) => l.trim().length > 0);
      formData.append("links", JSON.stringify(validLinks));
      formData.append("participants", JSON.stringify(selectedParticipants));

      const result = await updateEvent(event.id, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (eventPast) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update your event details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-4">
            {/* Event Name */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Event Name *</Label>
              <Input
                id="edit-name"
                placeholder="Dinner at The Chop House"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={(date) => date && setEventDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-start-time">Start Time</Label>
                <Input
                  id="edit-start-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end-time">End Time</Label>
                <Input
                  id="edit-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Details</Label>
              <Textarea
                id="edit-description"
                placeholder="Reservation for 6 people, confirmation #12345..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Links */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Links</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddLink}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Link
                </Button>
              </div>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://..."
                        value={link}
                        onChange={(e) => handleLinkChange(index, e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {links.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLink(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Participants */}
            {members.length > 0 && (
              <div className="grid gap-2">
                <Label>Tag Members</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={`edit-member-${member.id}`}
                        checked={selectedParticipants.includes(member.id)}
                        onCheckedChange={() => toggleParticipant(member.id)}
                      />
                      <label
                        htmlFor={`edit-member-${member.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          {(
                            member.display_name?.[0] || member.email[0]
                          ).toUpperCase()}
                        </div>
                        {member.display_name || member.email}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select members who are part of this event
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
