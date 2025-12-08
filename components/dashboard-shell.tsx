"use client";

import { ReactNode } from "react";
import { SnowProvider } from "@/lib/snow-context";
import { SnowfallBackground } from "@/components/snowfall-background";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SnowProvider>
      <SnowfallBackground />
      {children}
    </SnowProvider>
  );
}
