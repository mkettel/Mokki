"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { OpenMeteoWeatherData } from "@/types/database";
import { WeatherIcon } from "./weather/weather-icon";

interface DashboardHomeContentProps {
  houseName: string;
  weather: OpenMeteoWeatherData | null;
}

const links = [
  { href: "/dashboard/calendar", label: "Reserve your bed", row: 1 },
  { href: "/dashboard/snow-report", label: "Pow report", row: 1 },
  { href: "/dashboard/b-roll", label: "B-roll", row: 2 },
  { href: "/dashboard/bulletin-board", label: "Bulletin board", row: 2 },
  { href: "/dashboard/expenses", label: "Pay up", row: 2 },
  { href: "/dashboard/members", label: "Who's who", row: 3 },
  { href: "/dashboard/account", label: "about you", row: 3 },
];

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const formatTime = (date: Date) => {
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <span>
      {formatDate(time)} · {formatTime(time)}
    </span>
  );
}

export function DashboardHomeContent({
  houseName,
  weather,
}: DashboardHomeContentProps) {
  const row1Links = links.filter((l) => l.row === 1);
  const row2Links = links.filter((l) => l.row === 2);
  const row3Links = links.filter((l) => l.row === 3);

  return (
    <div className="w-full flex md:h-[calc(100vh-15rem)] h-[calc(100vh-13rem)] justify-between flex-col items-center md:mt-24 mt-10">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="md:text-[82px] text-7xl uppercase text-red font-bold w-full text-center"
        >
          {houseName}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          className="flex items-center justify-end gap-3 mt-2 text-sm text-muted-foreground"
        >
          <LiveClock />
          {weather && (
            <>
              <span>·</span>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                className="flex items-center gap-1.5"
              >
                <WeatherIcon
                  code={weather.current.weather_code}
                  isDay={weather.current.is_day}
                  className="h-4 w-4"
                />
                {Math.round(weather.current.temperature)}°F
              </motion.span>
            </>
          )}
        </motion.div>
      </div>

      <div className="flex flex-col flex-wrap md:gap-6 gap-0 md:max-w-3xl max-w-xl w-full md:mb-28 mb-0">
        {/* Row 1 */}
        <div className="flex justify-between md:flex-row items-center md:items-start flex-col">
          {row1Links.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.4 + index * 0.1,
                ease: "easeOut",
              }}
              className={`md:text-5xl text-4xl hover:line-through uppercase text-background font-boska font-medium ${
                index === 1 ? "md:ml-12 ml-0" : ""
              }`}
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex justify-between md:flex-row items-center md:items-start flex-col">
          {row2Links.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.5 + index * 0.1,
                ease: "easeOut",
              }}
              className="md:text-5xl text-4xl hover:line-through uppercase text-background font-boska font-medium"
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex justify-between md:flex-row items-center md:items-start flex-col">
          {row3Links.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.8 + index * 0.1,
                ease: "easeOut",
              }}
              className="md:text-5xl text-4xl hover:line-through uppercase text-background font-boska font-medium"
            >
              {link.label}
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
