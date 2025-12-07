"use client";

import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Snowflake,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
}

export function WeatherIcon({
  code,
  isDay = true,
  className,
}: WeatherIconProps) {
  const iconClass = cn("h-6 w-6", className);

  // Clear
  if (code === 0) {
    return isDay ? (
      <Sun className={cn(iconClass, "text-yellow-500")} />
    ) : (
      <Moon className={cn(iconClass, "text-blue-300")} />
    );
  }

  // Mainly clear / Partly cloudy
  if (code === 1 || code === 2) {
    return isDay ? (
      <CloudSun className={cn(iconClass, "text-yellow-500")} />
    ) : (
      <CloudMoon className={cn(iconClass, "text-blue-300")} />
    );
  }

  // Overcast
  if (code === 3) {
    return <Cloud className={cn(iconClass, "text-gray-400")} />;
  }

  // Fog
  if (code === 45 || code === 48) {
    return <CloudFog className={cn(iconClass, "text-gray-400")} />;
  }

  // Drizzle / Rain
  if (code >= 51 && code <= 67) {
    return <CloudRain className={cn(iconClass, "text-blue-400")} />;
  }

  // Snow
  if (code >= 71 && code <= 77) {
    return <Snowflake className={cn(iconClass, "text-blue-300")} />;
  }

  // Rain showers
  if (code >= 80 && code <= 82) {
    return <CloudRain className={cn(iconClass, "text-blue-500")} />;
  }

  // Snow showers
  if (code === 85 || code === 86) {
    return <CloudSnow className={cn(iconClass, "text-blue-300")} />;
  }

  // Thunderstorm
  if (code >= 95) {
    return <CloudLightning className={cn(iconClass, "text-yellow-400")} />;
  }

  // Default
  return <Cloud className={cn(iconClass, "text-gray-400")} />;
}
