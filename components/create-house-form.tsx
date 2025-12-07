"use client";

import { useActionState } from "react";
import { createHouse } from "@/lib/actions/house";
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
  const [state, formAction, isPending] = useActionState<
    { error: string | null },
    FormData
  >(
    async (_prevState, formData) => {
      const result = await createHouse(formData);
      return result || { error: null };
    },
    { error: null }
  );

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
        <form action={formAction}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">House Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Tahoe Ski House 2024"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="123 Mountain Rd, Lake Tahoe, CA"
              />
            </div>
            {state.error && <p className="text-sm text-red-500">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating..." : "Create House"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
