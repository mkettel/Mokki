"use client";

import { OpenMeteoWeatherData } from "@/types/database";
import { WeatherIcon } from "./weather-icon";
import { getWeatherDescription } from "@/lib/weather-utils";
import {
  Thermometer,
  Wind,
  Cloud,
  Snowflake,
  Mountain,
  Sun,
  Layers,
  ThermometerSnowflake,
} from "lucide-react";

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

  const getUVDescription = (uv: number): string => {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
  };

  // Check if today is a bluebird day (sunny, low clouds, good visibility)
  const todaySunshine = weather.daily?.sunshine_duration?.[0] ?? 0;
  const maxPossibleSunshine = 8 * 3600; // ~8 hours of daylight in winter
  const sunshinePercent = (todaySunshine / maxPossibleSunshine) * 100;
  const isBluebird = current.cloud_cover < 25 && sunshinePercent > 60;

  return (
    <div className="p-6">
      <div className="pb-4">
        <div className="flex items-center justify-between font-semibold text-lg">
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
              {elevation.toLocaleString()}&apos;
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {getWeatherDescription(current.weather_code)}
        </p>
      </div>
      <div className="space-y-4">
        {/* Bluebird Day Banner */}
        {isBluebird && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 text-sky-700 dark:text-sky-300">
            <Sun className="h-5 w-5" />
            <span className="font-medium">Bluebird Day!</span>
            <span className="text-sm opacity-80">Clear skies and sunshine</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Thermometer className="h-4 w-4" />
              <span>Temperature</span>
            </div>
            <p className="text-3xl font-bold">
              {Math.round(current.temperature)}°F
            </p>
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

          {/* Snow Depth */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Layers className="h-4 w-4" />
              <span>Snow Depth</span>
            </div>
            <p className="text-2xl font-bold">
              {current.snow_depth > 0
                ? `${Math.round(current.snow_depth)}"`
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {current.snow_depth > 0 ? "On the ground" : "No base reported"}
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

        {/* Second row with additional data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {/* Freezing Level */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <ThermometerSnowflake className="h-4 w-4" />
              <span>Freezing Level</span>
            </div>
            <p className="text-2xl font-bold">
              {current.freezing_level > 0
                ? `${Math.round(current.freezing_level).toLocaleString()}'`
                : "Surface"}
            </p>
            <p className="text-sm text-muted-foreground">
              {elevation && current.freezing_level > elevation
                ? "Above summit - rain possible"
                : "Snow likely at summit"}
            </p>
          </div>

          {/* UV Index */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Sun className="h-4 w-4" />
              <span>UV Index</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(current.uv_index)}</p>
            <p className="text-sm text-muted-foreground">
              {getUVDescription(current.uv_index)}
              {current.uv_index >= 6 && " - Wear sunscreen!"}
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

          {/* Sunshine */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Sun className="h-4 w-4" />
              <span>Sunshine Today</span>
            </div>
            <p className="text-2xl font-bold">
              {Math.round(todaySunshine / 3600)}h
            </p>
            <p className="text-sm text-muted-foreground">
              {sunshinePercent > 70
                ? "Sunny day"
                : sunshinePercent > 40
                ? "Some sun"
                : "Mostly cloudy"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
