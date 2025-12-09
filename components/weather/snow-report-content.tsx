"use client";

import { useState, useEffect, useMemo } from "react";
import { Resort, WeatherReport } from "@/types/database";
import { WeatherGrid } from "./weather-grid";
import { CurrentConditionsCard } from "./current-conditions-card";
import { HourlyForecastCard } from "./hourly-forecast-card";
import { SnowForecastCard } from "./snow-forecast-card";
import { WebcamGallery } from "./webcam-gallery";
import { FavoriteResortsPicker } from "./favorite-resorts-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SnowReportContentProps {
  houseId: string;
  houseName: string;
  favoriteResortIds: string[];
  resorts: Resort[];
  reports: WeatherReport[];
  isAdmin: boolean;
}

export function SnowReportContent({
  houseId,
  houseName,
  favoriteResortIds,
  resorts,
  reports,
  isAdmin,
}: SnowReportContentProps) {
  const [selectedResortId, setSelectedResortId] = useState<string | null>(null);

  // Get list of valid resort IDs for comparison
  const reportResortIds = useMemo(
    () => reports.map((r) => r.resort.id),
    [reports]
  );

  // Reset selection when reports change and current selection is invalid
  useEffect(() => {
    if (selectedResortId && !reportResortIds.includes(selectedResortId)) {
      // Current selection is no longer valid, reset to first resort or null
      setSelectedResortId(reports.length > 0 ? reports[0].resort.id : null);
    } else if (!selectedResortId && reports.length > 0) {
      // No selection but we have reports, select the first one
      setSelectedResortId(reports[0].resort.id);
    }
  }, [reportResortIds, selectedResortId, reports]);

  const selectedReport = reports.find((r) => r.resort.id === selectedResortId);

  return (
    <div className="space-y-6">
      {/* Header with Admin Controls */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Weather conditions for {houseName}
          </p>
        </div>
        <FavoriteResortsPicker
          houseId={houseId}
          currentFavorites={favoriteResortIds}
          resorts={resorts}
          isAdmin={isAdmin}
        />
      </div>

      {/* Weather Grid */}
      {reports.length > 0 ? (
        <>
          <WeatherGrid
            reports={reports}
            onResortClick={setSelectedResortId}
            selectedResortId={selectedResortId}
            houseId={houseId}
          />

          {/* Selected Resort Details */}
          {selectedReport && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Mountain className="h-5 w-5" />
                  {selectedReport.resort.name}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedResortId(null)}
                  className="gap-1"
                >
                  <ChevronUp className="h-4 w-4" />
                  Collapse
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <CurrentConditionsCard
                    weather={selectedReport.weather}
                    resortName={selectedReport.resort.name}
                    elevation={selectedReport.resort.elevation_summit}
                  />

                  <div className="border-t" />

                  <HourlyForecastCard weather={selectedReport.weather} />

                  <div className="border-t" />

                  <SnowForecastCard weather={selectedReport.weather} />

                  <div className="border-t" />

                  <WebcamGallery
                    webcams={selectedReport.resort.webcam_urls}
                    resortName={selectedReport.resort.name}
                    websiteUrl={selectedReport.resort.website_url}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Mountain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Resorts Selected</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin
                ? "Add some favorite resorts to see their weather conditions."
                : "Ask a house admin to add favorite resorts for this house."}
            </p>
            {isAdmin && (
              <FavoriteResortsPicker
                houseId={houseId}
                currentFavorites={favoriteResortIds}
                resorts={resorts}
                isAdmin={isAdmin}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
