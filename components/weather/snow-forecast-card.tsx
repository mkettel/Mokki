"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenMeteoWeatherData } from "@/types/database";
import { WeatherIcon } from "./weather-icon";
import { Snowflake } from "lucide-react";

interface SnowForecastCardProps {
  weather: OpenMeteoWeatherData;
}

export function SnowForecastCard({ weather }: SnowForecastCardProps) {
  const { daily } = weather;

  // Calculate total snow forecast
  const totalSnow = daily.snowfall_sum.reduce((sum, val) => sum + val, 0);

  // Format day name
  const formatDay = (dateStr: string, index: number): string => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate max snowfall for scaling bars
  const maxSnow = Math.max(...daily.snowfall_sum, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-blue-400" />
            <span>7-Day Snow Forecast</span>
          </div>
          <span
            className={`text-lg font-bold ${totalSnow > 0 ? "text-blue-400" : "text-muted-foreground"}`}
          >
            {totalSnow.toFixed(1)}" total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {daily.time.map((date, index) => (
            <div
              key={date}
              className="flex flex-col items-center p-2 rounded-md bg-accent/30"
            >
              {/* Day name */}
              <span className="text-xs font-medium">
                {formatDay(date, index)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(date)}
              </span>

              {/* Weather icon */}
              <div className="my-2">
                <WeatherIcon
                  code={daily.weather_code[index]}
                  isDay={true}
                  className="h-5 w-5"
                />
              </div>

              {/* Snow bar */}
              <div className="h-16 w-full flex items-end justify-center mb-2">
                {daily.snowfall_sum[index] > 0 ? (
                  <div
                    className="bg-blue-400 w-6 rounded-t transition-all"
                    style={{
                      height: `${Math.max(8, (daily.snowfall_sum[index] / maxSnow) * 100)}%`,
                    }}
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">—</div>
                )}
              </div>

              {/* Snow amount */}
              <div className="flex items-center gap-0.5">
                <Snowflake className="h-3 w-3 text-blue-400" />
                <span
                  className={`text-sm font-medium ${daily.snowfall_sum[index] > 0 ? "text-blue-400" : "text-muted-foreground"}`}
                >
                  {daily.snowfall_sum[index].toFixed(1)}"
                </span>
              </div>

              {/* Temp range */}
              <span className="text-xs text-muted-foreground mt-1">
                {Math.round(daily.temperature_min[index])}° /{" "}
                {Math.round(daily.temperature_max[index])}°
              </span>

              {/* Precip chance */}
              {daily.precipitation_probability_max[index] > 0 && (
                <span className="text-xs text-blue-400">
                  {daily.precipitation_probability_max[index]}%
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
