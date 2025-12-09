"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mountain,
  Calendar,
  DollarSign,
  MessageCircle,
  Home,
  Users,
  User,
  StickyNote,
  Snowflake,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { ThemeSwitcher } from "./theme-switcher";
import { SnowToggle } from "./snow-toggle";
import { HouseSwitcher } from "./house-switcher";
import { motion } from "framer-motion";

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
  { href: "/dashboard/snow-report", label: "Snow", icon: Snowflake },
  { href: "/dashboard/bulletin-board", label: "Board", icon: StickyNote },
  { href: "/dashboard/b-roll", label: "B-Roll", icon: Film },
  { href: "/dashboard/expenses", label: "Expenses", icon: DollarSign },
  // { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/account", label: "Account", icon: User },
];

export function DashboardNav({ house, houses }: DashboardNavProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/dashboard";

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo and House Name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              {/* <Mountain className="h-5 w-5" /> */}
              <span className="font-semibold inline uppercase">Mökki</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <HouseSwitcher activeHouse={house} houses={houses} />
          </motion.div>

          {/* Right side */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex items-center gap-2"
          >
            <SnowToggle />
            <ThemeSwitcher />
            {/* <LogoutButton /> */}
          </motion.div>
        </div>

        {/* Navigation - hidden on homepage */}
        {!isHomepage && (
          <nav className="flex items-center gap-1 overflow-x-auto pb-2 px-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.2 + index * 0.05,
                    ease: "easeOut",
                  }}
                >
                  <Link
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
                </motion.div>
              );
            })}
          </nav>
        )}
      </div>
    </motion.header>
  );
}
