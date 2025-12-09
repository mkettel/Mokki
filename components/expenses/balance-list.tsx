"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Check, ExternalLink } from "lucide-react";
import { settleAllWithUser } from "@/lib/actions/expenses";
import { VenmoHandle } from "./venmo-handle";
import type { UserBalance } from "@/types/database";

interface BalanceListProps {
  balances: UserBalance[];
  houseId: string;
}

export function BalanceList({ balances, houseId }: BalanceListProps) {
  const [settlingUserId, setSettlingUserId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSettleAll = async (userId: string) => {
    setSettlingUserId(userId);
    try {
      const result = await settleAllWithUser(houseId, userId);
      if (result.error) {
        console.error("Error settling:", result.error);
      }
    } finally {
      setSettlingUserId(null);
    }
  };

  const getVenmoUrl = (handle: string, amount: number, note: string) => {
    // Mobile deep link
    return `venmo://paycharge?txn=pay&recipients=${handle}&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note)}`;
  };

  const getVenmoWebUrl = (handle: string) => {
    return `https://venmo.com/${handle}`;
  };

  // Filter to only show members with non-zero balances
  const activeBalances = balances.filter((b) => b.netBalance !== 0);

  if (activeBalances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            All settled up! No outstanding balances.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeBalances.map((balance) => (
          <div
            key={balance.userId}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={balance.avatarUrl || undefined} />
                <AvatarFallback>
                  {getInitials(balance.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {balance.displayName || "Unknown User"}
                </p>
                {balance.venmoHandle && (
                  <VenmoHandle handle={balance.venmoHandle} />
                )}
                <p
                  className={`text-sm ${
                    balance.netBalance > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {balance.netBalance > 0
                    ? `Owes you ${formatCurrency(balance.netBalance)}`
                    : `You owe ${formatCurrency(balance.netBalance)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* If they owe you, show settle button */}
              {balance.netBalance > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSettleAll(balance.userId)}
                  disabled={settlingUserId === balance.userId}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {settlingUserId === balance.userId
                    ? "Settling..."
                    : "Mark Paid"}
                </Button>
              )}

              {/* If you owe them, show Venmo button */}
              {balance.netBalance < 0 && balance.venmoHandle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Try mobile deep link first, fall back to web
                    const mobileUrl = getVenmoUrl(
                      balance.venmoHandle!,
                      Math.abs(balance.netBalance),
                      "House expense settlement"
                    );
                    const webUrl = getVenmoWebUrl(balance.venmoHandle!);

                    // Try to open mobile app, but also open web as fallback
                    window.location.href = mobileUrl;
                    setTimeout(() => {
                      window.open(webUrl, "_blank");
                    }, 500);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Pay via Venmo
                </Button>
              )}

              {/* If you owe them but no Venmo */}
              {balance.netBalance < 0 && !balance.venmoHandle && (
                <span className="text-xs text-muted-foreground">
                  No Venmo linked
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
