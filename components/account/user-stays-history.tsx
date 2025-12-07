"use client";

import { format } from "date-fns";
import { Calendar, Users, DollarSign, Check, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { settleGuestFee, unsettleGuestFee } from "@/lib/actions/guest-fees";

interface ExpenseSplit {
  id: string;
  user_id: string;
  amount: number;
  settled: boolean;
  settled_at: string | null;
}

interface Stay {
  id: string;
  check_in: string;
  check_out: string;
  notes: string | null;
  guest_count: number;
  houses: {
    id: string;
    name: string;
  } | null;
  expenses: {
    id: string;
    amount: number;
    expense_splits: ExpenseSplit[];
  } | null;
}

interface UserStaysHistoryProps {
  stays: Stay[];
  currentUserId: string;
}

export function UserStaysHistory({ stays, currentUserId }: UserStaysHistoryProps) {
  const router = useRouter();
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const handleSettle = async (splitId: string) => {
    setSettlingId(splitId);

    try {
      const result = await settleGuestFee(splitId);
      if (result.error) throw new Error(result.error);
      router.refresh();
    } catch (err) {
      console.error("Error settling fee:", err);
      alert("Failed to settle fee");
    } finally {
      setSettlingId(null);
    }
  };

  const handleUnsettle = async (splitId: string) => {
    setSettlingId(splitId);

    try {
      const result = await unsettleGuestFee(splitId);
      if (result.error) throw new Error(result.error);
      router.refresh();
    } catch (err) {
      console.error("Error unsettling fee:", err);
      alert("Failed to unmark as paid");
    } finally {
      setSettlingId(null);
    }
  };

  if (stays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Your Stays with Guests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You haven&apos;t had any stays with guests yet. When you book a stay and add guests,
            you&apos;ll see your history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Your Stays with Guests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stays.map((stay) => {
            const checkIn = new Date(stay.check_in);
            const checkOut = new Date(stay.check_out);
            const userSplit = stay.expenses?.expense_splits.find(
              (s) => s.user_id === currentUserId
            );
            const isSettled = userSplit?.settled ?? false;

            return (
              <div
                key={stay.id}
                className="flex items-start justify-between gap-4 p-4 rounded-lg border"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium flex items-center gap-1.5">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      {stay.houses?.name || "Unknown House"}
                    </span>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Users className="h-3 w-3" />
                      {stay.guest_count} guest{stay.guest_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(checkIn, "MMM d")} - {format(checkOut, "MMM d, yyyy")}
                  </p>
                  {stay.notes && (
                    <p className="text-sm text-muted-foreground">{stay.notes}</p>
                  )}
                  {userSplit && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {userSplit.amount}
                      </span>
                      {isSettled ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Paid
                          {userSplit.settled_at && (
                            <span className="ml-1 opacity-75">
                              {format(new Date(userSplit.settled_at), "MMM d")}
                            </span>
                          )}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
                        >
                          Unpaid
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {userSplit && !isSettled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSettle(userSplit.id)}
                      disabled={settlingId === userSplit.id}
                    >
                      {settlingId === userSplit.id ? "..." : "Mark as Paid"}
                    </Button>
                  )}
                  {userSplit && isSettled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => handleUnsettle(userSplit.id)}
                      disabled={settlingId === userSplit.id}
                    >
                      {settlingId === userSplit.id ? "..." : "Unmark"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
