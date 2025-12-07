"use client";

import { WeatherReport } from "@/types/database";
import { ResortWeatherCard } from "./resort-weather-card";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

interface WeatherGridProps {
  reports: WeatherReport[];
  onResortClick?: (resortId: string) => void;
  selectedResortId?: string | null;
}

export function WeatherGrid({
  reports,
  onResortClick,
  selectedResortId,
}: WeatherGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Mountain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Resorts Selected</h3>
          <p className="text-muted-foreground">
            Add some favorite resorts to see their weather conditions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {reports.length} resort{reports.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.map((report) => (
          <div
            key={report.resort.id}
            onClick={() => onResortClick?.(report.resort.id)}
            className={`cursor-pointer transition-all ${
              selectedResortId === report.resort.id
                ? "ring-2 ring-primary rounded-lg"
                : ""
            }`}
          >
            <ResortWeatherCard report={report} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
