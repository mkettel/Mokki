"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { isPrecipitationWeather } from "@/lib/weather-utils";

interface SnowContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

const SnowContext = createContext<SnowContextType | undefined>(undefined);

const STORAGE_KEY = "mokki-snow-enabled";

interface SnowProviderProps {
  children: ReactNode;
  weatherCode?: number | null;
}

export function SnowProvider({ children, weatherCode }: SnowProviderProps) {
  const [enabled, setEnabledState] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasCheckedWeather = useRef(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setEnabledState(stored === "true");
    }
  }, []);

  // Auto-enable snow when weather indicates precipitation
  useEffect(() => {
    if (!mounted || hasCheckedWeather.current) return;
    hasCheckedWeather.current = true;

    // If weather is precipitating and snow is currently off, turn it on
    if (weatherCode !== undefined && weatherCode !== null && isPrecipitationWeather(weatherCode)) {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Only auto-enable if not already enabled (don't override user preference if already on)
      if (stored !== "true") {
        setEnabledState(true);
        localStorage.setItem(STORAGE_KEY, "true");
      }
    }
  }, [mounted, weatherCode]);

  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  const toggle = () => {
    setEnabled(!enabled);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <SnowContext.Provider value={{ enabled: false, setEnabled: () => {}, toggle: () => {} }}>
        {children}
      </SnowContext.Provider>
    );
  }

  return (
    <SnowContext.Provider value={{ enabled, setEnabled, toggle }}>
      {children}
    </SnowContext.Provider>
  );
}

export function useSnow() {
  const context = useContext(SnowContext);
  if (context === undefined) {
    throw new Error("useSnow must be used within a SnowProvider");
  }
  return context;
}
