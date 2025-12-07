"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar, CheckCircle } from "lucide-react";
import type { UserGuestFeeSummary } from "@/types/database";

interface GuestFeeSummaryProps {
  summary: UserGuestFeeSummary | null;
}

export function GuestFeeSummary({ summary }: GuestFeeSummaryProps) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guest Fees Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No guest fee data available yet. Book a stay with guests to see your
            summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Total Stays",
      value: summary.totalStays,
      icon: Calendar,
      description: "Stays with guests",
    },
    {
      label: "Total Guests",
      value: summary.totalGuests,
      icon: Users,
      description: "Guests across all stays",
    },
    {
      label: "Total Amount",
      value: `$${summary.totalAmount}`,
      icon: DollarSign,
      description: "Total guest fees",
    },
    {
      label: "Amount Paid",
      value: `$${summary.settledAmount}`,
      icon: CheckCircle,
      description: "Settled guest fees",
      variant: "success" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Guest Fees Summary</h2>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.unsettledAmount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Outstanding Balance
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  ${summary.unsettledAmount}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
              Mark your stays as paid once you&apos;ve settled up with the house
              owner.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
