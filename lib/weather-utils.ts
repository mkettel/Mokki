// Weather code to description mapping
const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function getWeatherDescription(code: number): string {
  return WEATHER_CODES[code] || "Unknown";
}

// Check if weather code indicates snow
export function isSnowWeather(code: number): boolean {
  return [71, 73, 75, 77, 85, 86].includes(code);
}

// Check if weather code indicates rain or snow (precipitation)
export function isPrecipitationWeather(code: number): boolean {
  // Rain codes: 51-67, 80-82, 95-99
  // Snow codes: 71, 73, 75, 77, 85, 86
  const precipitationCodes = [
    51,
    53,
    55,
    56,
    57,
    45, // drizzle
    61,
    63,
    65,
    66,
    67, // rain
    71,
    73,
    75,
    77, // snow
    80,
    81,
    82, // rain showers
    85,
    86, // snow showers
    95,
    96,
    99, // thunderstorms
  ];
  return precipitationCodes.includes(code);
}
