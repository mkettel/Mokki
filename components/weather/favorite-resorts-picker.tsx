"use client";

import { useState, useTransition } from "react";
import { Resort } from "@/types/database";
import { updateHouseFavoriteResorts } from "@/lib/actions/resorts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2, Loader2, Mountain, AlertCircle, Plus, Pencil } from "lucide-react";
import { ResortFormDialog } from "./resort-form-dialog";

interface FavoriteResortsPickerProps {
  houseId: string;
  currentFavorites: string[];
  resorts: Resort[];
  isAdmin: boolean;
}

export function FavoriteResortsPicker({
  houseId,
  currentFavorites,
  resorts,
  isAdmin,
}: FavoriteResortsPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(currentFavorites);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resortFormOpen, setResortFormOpen] = useState(false);
  const [editingResort, setEditingResort] = useState<Resort | null>(null);

  if (!isAdmin) {
    return null;
  }

  const handleAddResort = () => {
    setEditingResort(null);
    setResortFormOpen(true);
  };

  const handleEditResort = (resort: Resort, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingResort(resort);
    setResortFormOpen(true);
  };

  const handleToggle = (resortId: string) => {
    setError(null);
    setSelected((prev) =>
      prev.includes(resortId)
        ? prev.filter((id) => id !== resortId)
        : [...prev, resortId]
    );
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateHouseFavoriteResorts(houseId, selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setError(null);
      setSelected(currentFavorites);
    }
  };

  const hasChanges =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify([...currentFavorites].sort());

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Manage Resorts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mountain className="h-5 w-5" />
            Favorite Resorts
          </DialogTitle>
          <DialogDescription>
            Select resorts to display on your snow report dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
          <div className="space-y-3">
            {resorts.map((resort) => (
              <label
                key={resort.id}
                className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors group"
              >
                <Checkbox
                  checked={selected.includes(resort.id)}
                  onCheckedChange={() => handleToggle(resort.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{resort.name}</p>
                  {resort.elevation_summit && (
                    <p className="text-sm text-muted-foreground">
                      Summit: {resort.elevation_summit.toLocaleString()}'
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleEditResort(resort, e)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </label>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={handleAddResort}
          >
            <Plus className="h-4 w-4" />
            Add New Resort
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selected.length} resort{selected.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending || !hasChanges}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      <ResortFormDialog
        open={resortFormOpen}
        onOpenChange={setResortFormOpen}
        resort={editingResort}
      />
    </>
  );
}
