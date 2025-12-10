"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mountain, Calendar, DollarSign, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface HomepageContentProps {
  isLoggedIn: boolean;
}

const features = [
  {
    icon: <Calendar className="w-8 h-8" />,
    title: "Track Stays",
    description:
      "See who's at the house and when. Plan your trips around the group.",
  },
  {
    icon: <DollarSign className="w-8 h-8" />,
    title: "Split Expenses",
    description:
      "Track groceries, utilities, and shared costs. Know who owes what.",
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    title: "Stay Connected",
    description:
      "Group chat to coordinate plans and share updates with everyone.",
  },
];

export function HomepageContent({ isLoggedIn }: HomepageContentProps) {
  return (
    <>
      {/* Animated Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex h-14 items-center justify-between px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-2"
            >
              <Mountain className="h-5 w-5" />
              <span className="font-semibold uppercase">Mokki</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex items-center gap-2"
            >
              <ThemeSwitcher />
              {isLoggedIn ? (
                <Button asChild size="sm" variant="default">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/auth/login">Sign in</Link>
                  </Button>
                  <Button asChild size="sm" variant="default">
                    <Link href="/auth/sign-up">Sign up</Link>
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <div className="w-full flex md:h-[calc(100vh-50rem)] h-auto min-h-[200px] md:min-h-[300px] justify-center flex-col items-center md:mt-12 mt-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="md:text-[82px] text-6xl uppercase text-red font-bold w-full text-center"
            >
              Mokki
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="text-xl lg:text-2xl bg-blend-soft-light mt-4 text-black dark:text-foreground"
            >
              Your ski house, organized.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="text-base mt-2 max-w-md mx-auto text-black dark:text-foreground"
            >
              Track who&apos;s staying, split expenses, and keep everyone in the
              loop.
            </motion.p>
          </div>

          {/* Feature Cards */}
          <div className="hidden grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.5 + index * 0.1,
                  ease: "easeOut",
                }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="text-red mb-2">{feature.icon}</div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
            className="flex gap-4 mt-20"
          >
            {isLoggedIn ? (
              <Button asChild size="lg" variant="default">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" variant="default">
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.9, ease: "easeOut" }}
        className="w-full flex items-center justify-center mx-auto text-center text-xs gap-8 py-8"
      >
        <p className="text-black font-medium">
          Mokki - Your ski house, organized.
        </p>
      </motion.footer>
    </>
  );
}
