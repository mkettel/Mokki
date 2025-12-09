"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import type { ExpenseSummary } from "@/types/database";

interface ExpenseSummaryCardsProps {
  summary: ExpenseSummary;
}

export function ExpenseSummaryCards({ summary }: ExpenseSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  return (
    <div className="grid gap-2 md:grid-cols-3 mb-6 border-b pb-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
          <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">You Owe</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary.totalYouOwe)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
          <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">You&apos;re Owed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary.totalYouAreOwed)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
          <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Net Balance</p>
          <p
            className={`text-2xl font-bold ${
              summary.netBalance >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {summary.netBalance >= 0 ? "+" : "-"}
            {formatCurrency(summary.netBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}
