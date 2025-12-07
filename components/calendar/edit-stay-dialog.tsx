"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { CalendarIcon, Plus, Minus, Users, Pencil } from "lucide-react";
import { updateStay } from "@/lib/actions/stays";
import { GUEST_FEE_PER_NIGHT } from "@/lib/constants";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Stay {
  id: string;
  check_in: string;
  check_out: string;
  notes: string | null;
  guest_count: number;
  user_id: string;
}

interface EditStayDialogProps {
  stay: Stay;
  trigger?: React.ReactNode;
}

export function EditStayDialog({ stay, trigger }: EditStayDialogProps) {
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>(new Date(stay.check_in));
  const [checkOut, setCheckOut] = useState<Date>(new Date(stay.check_out));
  const [notes, setNotes] = useState(stay.notes || "");
  const [guestCount, setGuestCount] = useState(stay.guest_count);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCheckIn(new Date(stay.check_in));
      setCheckOut(new Date(stay.check_out));
      setNotes(stay.notes || "");
      setGuestCount(stay.guest_count);
      setError(null);
    }
  }, [open, stay]);

  // Calculate nights and cost
  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;
  const totalCost = guestCount * GUEST_FEE_PER_NIGHT * nights;

  // Check if stay has ended (can't edit past stays)
  const stayEnded = isPast(new Date(stay.check_out));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates");
      setIsLoading(false);
      return;
    }

    if (checkOut < checkIn) {
      setError("Check-out must be after check-in");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("check_in", format(checkIn, "yyyy-MM-dd"));
      formData.append("check_out", format(checkOut, "yyyy-MM-dd"));
      formData.append("notes", notes.trim());
      formData.append("guest_count", guestCount.toString());

      const result = await updateStay(stay.id, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Error updating stay:", err);
      setError("Failed to update stay. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (stayEnded) {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Stay</DialogTitle>
          <DialogDescription>
            Update your stay details and guest count.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Check-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={(date) => date && setCheckIn(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Check-out Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={(date) => date && setCheckOut(date)}
                    disabled={(date) => (checkIn ? date < checkIn : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Arriving late Friday..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Number of Guests</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                  disabled={guestCount === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 min-w-[60px] justify-center">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-medium">{guestCount}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                  disabled={guestCount === 20}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ${GUEST_FEE_PER_NIGHT}/night per guest
              </p>
            </div>
          </div>

          {guestCount > 0 && nights > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Guest Fee</p>
              <p className="text-xs text-muted-foreground mt-1">
                {guestCount} guest{guestCount !== 1 ? "s" : ""} × {nights} night
                {nights !== 1 ? "s" : ""} × ${GUEST_FEE_PER_NIGHT} ={" "}
                <span className="font-semibold text-foreground">
                  ${totalCost}
                </span>
              </p>
            </div>
          )}

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
