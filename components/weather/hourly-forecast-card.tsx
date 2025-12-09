"use client";

import { OpenMeteoWeatherData } from "@/types/database";
import { WeatherIcon } from "./weather-icon";
import { Clock, Droplets, Snowflake } from "lucide-react";

interface HourlyForecastCardProps {
  weather: OpenMeteoWeatherData;
}

export function HourlyForecastCard({ weather }: HourlyForecastCardProps) {
  const hourly = weather.hourly;

  if (!hourly?.time) {
    return null;
  }

  // Get the next 24 hours of data
  const now = new Date();
  const currentHour = now.getHours();

  // Find the index of the current hour
  const startIndex = hourly.time.findIndex((time) => {
    const hourTime = new Date(time);
    return hourTime >= now;
  });

  // Get 24 hours of data starting from now
  const hoursToShow = 24;
  const hourlyData = [];

  for (let i = 0; i < hoursToShow && startIndex + i < hourly.time.length; i++) {
    const idx = startIndex + i;
    hourlyData.push({
      time: hourly.time[idx],
      temp: hourly.temperature[idx],
      precipProb: hourly.precipitation_probability[idx],
      precip: hourly.precipitation[idx],
      snowfall: hourly.snowfall[idx],
      weatherCode: hourly.weather_code[idx],
    });
  }

  const formatHour = (timeStr: string) => {
    const date = new Date(timeStr);
    const hour = date.getHours();
    if (hour === 0) return "12am";
    if (hour === 12) return "12pm";
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };

  // Find hours with snow
  const snowHours = hourlyData.filter((h) => h.snowfall > 0);
  const hasSnowComing = snowHours.length > 0;

  return (
    <div className="p-6">
      <div className="pb-4">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Clock className="h-5 w-5" />
          24-Hour Forecast
        </div>
        {hasSnowComing && (
          <p className="text-sm text-blue-500 flex items-center gap-1">
            <Snowflake className="h-4 w-4" />
            Snow expected in the next 24 hours
          </p>
        )}
      </div>
      <div>
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-3 py-2" style={{ minWidth: "max-content" }}>
            {hourlyData.map((hour, i) => {
              const isNow = i === 0;
              const hasSnow = hour.snowfall > 0;
              const hasPrecip = hour.precip > 0;

              return (
                <div
                  key={hour.time}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px] ${
                    isNow
                      ? "bg-primary/10 ring-1 ring-primary"
                      : hasSnow
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : ""
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      isNow ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {isNow ? "Now" : formatHour(hour.time)}
                  </span>

                  <WeatherIcon
                    code={hour.weatherCode}
                    isDay={true}
                    className="h-6 w-6"
                  />

                  <span className="text-sm font-bold">
                    {Math.round(hour.temp)}°
                  </span>

                  {/* Precipitation probability */}
                  {hour.precipProb > 0 && (
                    <div className="flex items-center gap-0.5 text-xs text-blue-500">
                      <Droplets className="h-3 w-3" />
                      <span>{hour.precipProb}%</span>
                    </div>
                  )}

                  {/* Snowfall amount */}
                  {hasSnow && (
                    <div className="flex items-center gap-0.5 text-xs text-blue-600 font-medium">
                      <Snowflake className="h-3 w-3" />
                      <span>{hour.snowfall.toFixed(1)}"</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between mt-0 pt-4 text-sm text-muted-foreground">
          <div>
            High:{" "}
            <span className="font-medium text-foreground">
              {Math.round(Math.max(...hourlyData.map((h) => h.temp)))}°
            </span>
            {" · "}
            Low:{" "}
            <span className="font-medium text-foreground">
              {Math.round(Math.min(...hourlyData.map((h) => h.temp)))}°
            </span>
          </div>
          {hasSnowComing && (
            <div className="flex items-center gap-1 text-blue-500">
              <Snowflake className="h-4 w-4" />
              <span>
                {snowHours.reduce((sum, h) => sum + h.snowfall, 0).toFixed(1)}"
                expected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
