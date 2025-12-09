"use client";

import { ReactNode } from "react";
import { SnowProvider } from "@/lib/snow-context";
import { SnowfallBackground } from "@/components/snowfall-background";

interface DashboardShellProps {
  children: ReactNode;
  weatherCode?: number | null;
}

export function DashboardShell({ children, weatherCode }: DashboardShellProps) {
  return (
    <SnowProvider weatherCode={weatherCode}>
      <SnowfallBackground />
      {children}
    </SnowProvider>
  );
}
