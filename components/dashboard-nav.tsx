"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mountain,
  Calendar,
  DollarSign,
  MessageCircle,
  Home,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { ThemeSwitcher } from "./theme-switcher";

interface House {
  id: string;
  name: string;
  role?: string;
}

interface DashboardNavProps {
  house: House;
  houses: House[];
}

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/expenses", label: "Expenses", icon: DollarSign },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav({ house }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo and House Name */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Mountain className="h-5 w-5" />
              <span className="font-semibold hidden sm:inline uppercase">
                Mökki
              </span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium uppercase text-sm truncate max-w-[150px]">
              {house.name}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
