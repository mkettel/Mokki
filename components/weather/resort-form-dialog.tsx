"use client";

import { useState, useTransition } from "react";
import { Resort, WebcamConfig } from "@/types/database";
import {
  createResort,
  updateResort,
  deleteResort,
  CreateResortInput,
} from "@/lib/actions/resorts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, AlertCircle } from "lucide-react";

interface ResortFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resort?: Resort | null;
  onSuccess?: () => void;
}

export function ResortFormDialog({
  open,
  onOpenChange,
  resort,
  onSuccess,
}: ResortFormDialogProps) {
  const isEditing = !!resort;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: resort?.name || "",
    latitude: resort?.latitude?.toString() || "",
    longitude: resort?.longitude?.toString() || "",
    elevation_base: resort?.elevation_base?.toString() || "",
    elevation_summit: resort?.elevation_summit?.toString() || "",
    timezone: resort?.timezone || "America/Los_Angeles",
    website_url: resort?.website_url || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setError("Latitude and longitude are required");
      return;
    }

    const input: CreateResortInput = {
      name: formData.name,
      latitude: lat,
      longitude: lon,
      elevation_base: formData.elevation_base
        ? parseInt(formData.elevation_base)
        : undefined,
      elevation_summit: formData.elevation_summit
        ? parseInt(formData.elevation_summit)
        : undefined,
      timezone: formData.timezone || undefined,
      website_url: formData.website_url || undefined,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateResort(resort.id, input)
        : await createResort(input);

      if (result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    });
  };

  const handleDelete = () => {
    if (!resort) return;

    startTransition(async () => {
      const result = await deleteResort(resort.id);
      if (result.error) {
        setError(result.error);
        setShowDeleteConfirm(false);
        return;
      }

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      setFormData({
        name: "",
        latitude: "",
        longitude: "",
        elevation_base: "",
        elevation_summit: "",
        timezone: "America/Los_Angeles",
        website_url: "",
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Resort" : "Add New Resort"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the resort details below."
                : "Add a new ski resort to track weather conditions."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Resort Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Palisades Tahoe"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  placeholder="e.g., 39.1969"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  placeholder="e.g., -120.2356"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="elevation_base">Base Elevation (ft)</Label>
                <Input
                  id="elevation_base"
                  type="number"
                  value={formData.elevation_base}
                  onChange={(e) =>
                    setFormData({ ...formData, elevation_base: e.target.value })
                  }
                  placeholder="e.g., 6200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="elevation_summit">Summit Elevation (ft)</Label>
                <Input
                  id="elevation_summit"
                  type="number"
                  value={formData.elevation_summit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      elevation_summit: e.target.value,
                    })
                  }
                  placeholder="e.g., 9050"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                placeholder="e.g., America/Los_Angeles"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) =>
                  setFormData({ ...formData, website_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              {isEditing ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Save Changes" : "Add Resort"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resort</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {resort?.name}? This action cannot
              be undone. The resort will be removed from all houses' favorites.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
