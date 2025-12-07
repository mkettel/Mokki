"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenMeteoWeatherData } from "@/types/database";
import { WeatherIcon } from "./weather-icon";
import { getWeatherDescription } from "@/lib/weather-utils";
import { Thermometer, Wind, Cloud, Snowflake, Mountain } from "lucide-react";

interface CurrentConditionsCardProps {
  weather: OpenMeteoWeatherData;
  resortName: string;
  elevation?: number | null;
}

export function CurrentConditionsCard({
  weather,
  resortName,
  elevation,
}: CurrentConditionsCardProps) {
  const current = weather.current;

  // Get wind direction as compass
  const getWindDirection = (degrees: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WeatherIcon
              code={current.weather_code}
              isDay={current.is_day}
              className="h-8 w-8"
            />
            <span>{resortName}</span>
          </div>
          {elevation && (
            <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
              <Mountain className="h-4 w-4" />
              {elevation.toLocaleString()}'
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getWeatherDescription(current.weather_code)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Thermometer className="h-4 w-4" />
              <span>Temperature</span>
            </div>
            <p className="text-3xl font-bold">{Math.round(current.temperature)}°F</p>
            <p className="text-sm text-muted-foreground">
              Feels {Math.round(current.apparent_temperature)}°
            </p>
          </div>

          {/* Wind */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Wind className="h-4 w-4" />
              <span>Wind</span>
            </div>
            <p className="text-2xl font-bold">
              {Math.round(current.wind_speed)} mph
            </p>
            <p className="text-sm text-muted-foreground">
              {getWindDirection(current.wind_direction)} • Gusts{" "}
              {Math.round(current.wind_gusts)} mph
            </p>
          </div>

          {/* Cloud Cover */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Cloud className="h-4 w-4" />
              <span>Cloud Cover</span>
            </div>
            <p className="text-2xl font-bold">{current.cloud_cover}%</p>
            <p className="text-sm text-muted-foreground">
              {current.cloud_cover < 25
                ? "Clear"
                : current.cloud_cover < 50
                  ? "Partly cloudy"
                  : current.cloud_cover < 75
                    ? "Mostly cloudy"
                    : "Overcast"}
            </p>
          </div>

          {/* Current Snow */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Snowflake className="h-4 w-4" />
              <span>Snowfall</span>
            </div>
            <p className="text-2xl font-bold">
              {current.snowfall > 0 ? `${current.snowfall.toFixed(1)}"` : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {current.snowfall > 0 ? "Currently snowing" : "No snow right now"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
