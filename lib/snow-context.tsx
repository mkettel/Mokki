"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SnowContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

const SnowContext = createContext<SnowContextType | undefined>(undefined);

const STORAGE_KEY = "mokki-snow-enabled";

export function SnowProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setEnabledState(stored === "true");
    }
  }, []);

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
