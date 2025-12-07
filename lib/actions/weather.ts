"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  OpenMeteoWeatherData,
  WeatherReport,
} from "@/types/database";
import { getResort } from "./resorts";

// Fetch weather from Open-Meteo API
// Validate coordinates
function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

async function fetchOpenMeteoWeather(
  latitude: number,
  longitude: number,
  elevation?: number
): Promise<OpenMeteoWeatherData> {
  // Validate inputs
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error("Invalid coordinates");
  }
  if (elevation !== undefined && (elevation < 0 || elevation > 30000)) {
    throw new Error("Invalid elevation");
  }

  const baseUrl = "https://api.open-meteo.com/v1/forecast";

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "snowfall",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "weather_code",
      "cloud_cover",
      "is_day",
      "snow_depth",
      "freezing_level_height",
      "uv_index",
    ].join(","),
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "precipitation",
      "snowfall",
      "weather_code",
    ].join(","),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "snowfall_sum",
      "precipitation_probability_max",
      "weather_code",
      "sunshine_duration",
      "sunrise",
      "sunset",
      "uv_index_max",
    ].join(","),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "auto",
    forecast_days: "7",
  });

  // Add elevation if provided (for mountain forecasts)
  if (elevation) {
    // Convert feet to meters for the API
    const elevationMeters = Math.round(elevation * 0.3048);
    params.append("elevation", elevationMeters.toString());
  }

  const response = await fetch(`${baseUrl}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Failed to parse weather API response");
  }

  // Validate response structure
  if (!data.current || !data.daily) {
    throw new Error("Invalid weather API response structure");
  }

  // Transform to our format
  // Convert snow depth from meters to inches
  const snowDepthInches = (data.current.snow_depth || 0) * 39.3701;
  // Convert freezing level from meters to feet
  const freezingLevelFeet = (data.current.freezing_level_height || 0) * 3.28084;

  return {
    current: {
      temperature: data.current.temperature_2m,
      apparent_temperature: data.current.apparent_temperature,
      precipitation: data.current.precipitation,
      snowfall: data.current.snowfall,
      wind_speed: data.current.wind_speed_10m,
      wind_direction: data.current.wind_direction_10m,
      wind_gusts: data.current.wind_gusts_10m,
      weather_code: data.current.weather_code,
      cloud_cover: data.current.cloud_cover,
      is_day: data.current.is_day === 1,
      snow_depth: snowDepthInches,
      freezing_level: freezingLevelFeet,
      uv_index: data.current.uv_index || 0,
    },
    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m,
      precipitation_probability: data.hourly.precipitation_probability,
      precipitation: data.hourly.precipitation,
      snowfall: data.hourly.snowfall,
      weather_code: data.hourly.weather_code,
    },
    daily: {
      time: data.daily.time,
      temperature_max: data.daily.temperature_2m_max,
      temperature_min: data.daily.temperature_2m_min,
      precipitation_sum: data.daily.precipitation_sum,
      snowfall_sum: data.daily.snowfall_sum,
      precipitation_probability_max: data.daily.precipitation_probability_max,
      weather_code: data.daily.weather_code,
      sunshine_duration: data.daily.sunshine_duration,
      sunrise: data.daily.sunrise,
      sunset: data.daily.sunset,
      uv_index_max: data.daily.uv_index_max,
    },
  };
}

// Cached weather fetch function - 30 minute cache
const getCachedWeather = unstable_cache(
  async (resortId: string, lat: number, lon: number, elevation?: number) => {
    return fetchOpenMeteoWeather(lat, lon, elevation);
  },
  ["weather-data"],
  { revalidate: 1800, tags: ["weather"] }
);

export async function getWeatherReport(resortId: string): Promise<{
  report: WeatherReport | null;
  error: string | null;
}> {
  try {
    const { resort, error: resortError } = await getResort(resortId);

    if (resortError || !resort) {
      return { report: null, error: resortError || "Resort not found" };
    }

    const weather = await getCachedWeather(
      resortId,
      resort.latitude,
      resort.longitude,
      resort.elevation_summit || undefined
    );

    return {
      report: {
        resort,
        weather,
        fetchedAt: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching weather report:", error);
    return { report: null, error: "Failed to fetch weather data" };
  }
}

// Get weather for a house's associated resort
export async function getHouseWeatherReport(houseId: string): Promise<{
  report: WeatherReport | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Auth check - user must be authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { report: null, error: "Not authenticated" };
  }

  // Check user is a member of this house
  const { data: membership } = await supabase
    .from("house_members")
    .select("id")
    .eq("house_id", houseId)
    .eq("user_id", user.id)
    .eq("invite_status", "accepted")
    .maybeSingle();

  if (!membership) {
    return { report: null, error: "Not a member of this house" };
  }

  const { data: house, error: houseError } = await supabase
    .from("houses")
    .select("resort_id")
    .eq("id", houseId)
    .single();

  if (houseError || !house?.resort_id) {
    return { report: null, error: "No resort configured for this house" };
  }

  return getWeatherReport(house.resort_id);
}

// Get weather for multiple resorts at once
export async function getMultipleWeatherReports(resortIds: string[]): Promise<{
  reports: WeatherReport[];
  error: string | null;
}> {
  if (resortIds.length === 0) {
    return { reports: [], error: null };
  }

  try {
    const reports = await Promise.all(
      resortIds.map(async (resortId) => {
        const { report } = await getWeatherReport(resortId);
        return report;
      })
    );

    return {
      reports: reports.filter((r): r is WeatherReport => r !== null),
      error: null,
    };
  } catch (error) {
    console.error("Error fetching multiple weather reports:", error);
    return { reports: [], error: "Failed to fetch weather data" };
  }
}
