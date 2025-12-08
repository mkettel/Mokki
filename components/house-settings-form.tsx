"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateHouse } from "@/lib/actions/house";
import { Resort } from "@/types/database";

interface HouseSettingsFormProps {
  house: {
    id: string;
    name: string;
    address: string | null;
    resort_id: string | null;
  };
  resorts: Resort[];
}

export function HouseSettingsForm({ house, resorts }: HouseSettingsFormProps) {
  const [name, setName] = useState(house.name || "");
  const [address, setAddress] = useState(house.address || "");
  const [resortId, setResortId] = useState(house.resort_id || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("address", address);
      formData.append("resort_id", resortId);

      const result = await updateHouse(house.id, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess("House settings updated successfully");
      router.refresh();
    } catch (err) {
      console.error("Error updating house:", err);
      setError("Failed to update house settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="house_name">House Name</Label>
        <Input
          id="house_name"
          type="text"
          placeholder="Our Ski Cabin"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          The name of your shared house
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="house_address">Address</Label>
        <Input
          id="house_address"
          type="text"
          placeholder="123 Mountain Road, Ski Town, CO 80435"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={200}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Full address for reference (optional)
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="house_resort">Linked Resort</Label>
        <Select value={resortId} onValueChange={setResortId} disabled={isLoading}>
          <SelectTrigger id="house_resort">
            <SelectValue placeholder="Select a resort..." />
          </SelectTrigger>
          <SelectContent>
            {resorts.map((resort) => (
              <SelectItem key={resort.id} value={resort.id}>
                <div className="flex items-center gap-2">
                  <span>{resort.name}</span>
                  {resort.elevation_summit && (
                    <span className="text-xs text-muted-foreground">
                      {resort.elevation_summit.toLocaleString()}&apos;
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Weather data on the homepage is based on this resort
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
