"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WeatherReport } from "@/types/database";
import { WeatherIcon } from "./weather-icon";
import { getWeatherDescription } from "@/lib/weather-utils";
import { Snowflake, Wind, Mountain, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ResortWeatherCardProps {
  report: WeatherReport;
  compact?: boolean;
}

export function ResortWeatherCard({ report, compact = false }: ResortWeatherCardProps) {
  const { resort, weather } = report;
  const current = weather.current;
  const snowfallData = weather.daily?.snowfall_sum ?? [];

  // Calculate total snow in next 3 days (with null safety)
  const snow3Day = snowfallData.slice(0, 3).reduce((a, b) => a + (b ?? 0), 0);

  // Calculate total snow in next 7 days (with null safety)
  const snow7Day = snowfallData.reduce((a, b) => a + (b ?? 0), 0);

  if (compact) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{resort.name}</h3>
              <p className="text-xs text-muted-foreground">
                {getWeatherDescription(current.weather_code)}
              </p>
            </div>
            <WeatherIcon
              code={current.weather_code}
              isDay={current.is_day}
              className="h-8 w-8 flex-shrink-0"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold">{Math.round(current.temperature)}°</p>
              <p className="text-xs text-muted-foreground">Now</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {snow3Day > 0 ? `${snow3Day.toFixed(0)}"` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">3-Day</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">
                {snow7Day > 0 ? `${snow7Day.toFixed(0)}"` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">7-Day</p>
            </div>
          </div>

          {/* Wind info */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              <span>{Math.round(current.wind_speed)} mph</span>
            </div>
            {resort.elevation_summit && (
              <div className="flex items-center gap-1">
                <Mountain className="h-3 w-3" />
                <span>{resort.elevation_summit.toLocaleString()}'</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full card with more details
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{resort.name}</h3>
              {resort.website_url && (
                <a
                  href={resort.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {getWeatherDescription(current.weather_code)}
            </p>
          </div>
          <WeatherIcon
            code={current.weather_code}
            isDay={current.is_day}
            className="h-10 w-10 flex-shrink-0"
          />
        </div>

        {/* Current temp and snow forecast */}
        <div className="grid grid-cols-4 gap-3 text-center mb-4">
          <div>
            <p className="text-3xl font-bold">{Math.round(current.temperature)}°</p>
            <p className="text-xs text-muted-foreground">
              Feels {Math.round(current.apparent_temperature)}°
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {current.snowfall > 0 ? (
                <span className="text-blue-400">{current.snowfall.toFixed(1)}"</span>
              ) : (
                "—"
              )}
            </p>
            <p className="text-xs text-muted-foreground">Snowing</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">
              {snow3Day > 0 ? `${snow3Day.toFixed(1)}"` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">3-Day</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">
              {snow7Day > 0 ? `${snow7Day.toFixed(1)}"` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">7-Day</p>
          </div>
        </div>

        {/* 7-day mini forecast */}
        <div className="flex gap-1 mb-3">
          {(weather.daily?.time ?? []).map((date, i) => {
            const daySnow = snowfallData[i] ?? 0;
            const maxSnow = Math.max(...snowfallData, 1);
            const weekday = (() => {
              try {
                const parsed = new Date(date + "T12:00:00");
                if (isNaN(parsed.getTime())) return "?";
                return parsed.toLocaleDateString("en-US", { weekday: "narrow" });
              } catch {
                return "?";
              }
            })();
            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center"
              >
                <div className="h-8 w-full flex items-end justify-center">
                  {daySnow > 0 ? (
                    <div
                      className="bg-blue-400 w-full max-w-[20px] rounded-t"
                      style={{ height: `${Math.max(4, (daySnow / maxSnow) * 100)}%` }}
                    />
                  ) : (
                    <div className="h-1 w-2 bg-muted rounded" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {weekday}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom stats */}
        <div className="pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Wind className="h-3.5 w-3.5" />
            <span>{Math.round(current.wind_speed)} mph</span>
            {current.wind_gusts > current.wind_speed + 10 && (
              <span className="text-xs">(gusts {Math.round(current.wind_gusts)})</span>
            )}
          </div>
          {resort.elevation_summit && (
            <div className="flex items-center gap-1">
              <Mountain className="h-3.5 w-3.5" />
              <span>{resort.elevation_summit.toLocaleString()}'</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
