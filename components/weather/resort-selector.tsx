"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Resort } from "@/types/database";
import { updateHouseResort } from "@/lib/actions/resorts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mountain, Check } from "lucide-react";

interface ResortSelectorProps {
  houseId: string;
  currentResortId: string | null;
  resorts: Resort[];
  isAdmin: boolean;
}

export function ResortSelector({
  houseId,
  currentResortId,
  resorts,
  isAdmin,
}: ResortSelectorProps) {
  const [selectedResort, setSelectedResort] = useState(currentResortId || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateHouseResort(
        houseId,
        selectedResort || null
      );
      if (!result.error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    });
  };

  const currentResort = resorts.find((r) => r.id === currentResortId);
  const hasChanges = selectedResort !== (currentResortId || "");

  if (!isAdmin) {
    return currentResort ? (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mountain className="h-4 w-4" />
        <span>{currentResort.name}</span>
      </div>
    ) : null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mountain className="h-4 w-4" />
          Resort Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-2 block">
              Select your nearby resort for weather data
            </label>
            <Select value={selectedResort} onValueChange={setSelectedResort}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resort..." />
              </SelectTrigger>
              <SelectContent>
                {resorts.map((resort) => (
                  <SelectItem key={resort.id} value={resort.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{resort.name}</span>
                      {resort.elevation_summit && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {resort.elevation_summit.toLocaleString()}'
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="min-w-[80px]"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Saved
              </>
            ) : isPending ? (
              "Saving..."
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
