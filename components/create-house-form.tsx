"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain } from "lucide-react";

export function CreateHouseForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("House name is required");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in");
        return;
      }

      // Create the house
      const { data: house, error: houseError } = await supabase
        .from("houses")
        .insert({
          name: name.trim(),
          address: address.trim() || null,
          settings: {},
        })
        .select()
        .single();

      if (houseError) throw houseError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from("house_members")
        .insert({
          house_id: house.id,
          user_id: user.id,
          role: "admin",
          invite_status: "accepted",
          joined_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Error creating house:", err);
      setError("Failed to create house. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Mountain className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create Your House</CardTitle>
        <CardDescription>
          Set up your ski house to start tracking stays and expenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">House Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tahoe Ski House 2024"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Mountain Rd, Lake Tahoe, CA"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create House"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
