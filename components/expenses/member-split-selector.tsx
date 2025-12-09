"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Calculator } from "lucide-react";
import type { Profile } from "@/types/database";

interface MemberSplitSelectorProps {
  members: (Profile & { memberId: string })[];
  currentUserId: string;
  totalAmount: number;
  onChange: (splits: { userId: string; amount: number }[]) => void;
  initialSplits?: { userId: string; amount: number }[];
}

type SplitMode = "even" | "custom";

export function MemberSplitSelector({
  members,
  currentUserId,
  totalAmount,
  onChange,
  initialSplits,
}: MemberSplitSelectorProps) {
  const [splitMode, setSplitMode] = useState<SplitMode>("even");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(() => {
    if (initialSplits) {
      return new Set(initialSplits.map((s) => s.userId));
    }
    // Default: select all members except current user
    return new Set(members.filter((m) => m.id !== currentUserId).map((m) => m.id));
  });
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (initialSplits) {
      const amounts: Record<string, string> = {};
      initialSplits.forEach((s) => {
        amounts[s.userId] = s.amount.toFixed(2);
      });
      return amounts;
    }
    return {};
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate splits based on mode
  useEffect(() => {
    if (splitMode === "even") {
      const selectedCount = selectedMembers.size;
      if (selectedCount === 0 || totalAmount <= 0) {
        onChange([]);
        return;
      }

      const evenAmount = Math.floor((totalAmount / selectedCount) * 100) / 100;
      const remainder = totalAmount - evenAmount * selectedCount;

      const splits: { userId: string; amount: number }[] = [];
      let index = 0;
      selectedMembers.forEach((userId) => {
        // Add remainder to first person to ensure total is exact
        const amount = index === 0 ? evenAmount + remainder : evenAmount;
        splits.push({ userId, amount: Math.round(amount * 100) / 100 });
        index++;
      });

      onChange(splits);
    } else {
      // Custom mode - use the amounts from customAmounts state
      const splits: { userId: string; amount: number }[] = [];
      selectedMembers.forEach((userId) => {
        const amountStr = customAmounts[userId] || "0";
        const amount = parseFloat(amountStr) || 0;
        if (amount > 0) {
          splits.push({ userId, amount });
        }
      });
      onChange(splits);
    }
  }, [selectedMembers, splitMode, totalAmount, customAmounts, onChange]);

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAll = () => {
    setSelectedMembers(new Set(members.filter((m) => m.id !== currentUserId).map((m) => m.id)));
  };

  const selectNone = () => {
    setSelectedMembers(new Set());
  };

  const handleCustomAmountChange = (userId: string, value: string) => {
    // Allow only valid decimal inputs
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmounts((prev) => ({ ...prev, [userId]: value }));
    }
  };

  // Calculate totals for display
  const customTotal = Array.from(selectedMembers).reduce((sum, userId) => {
    return sum + (parseFloat(customAmounts[userId] || "0") || 0);
  }, 0);

  const remainingAmount = totalAmount - customTotal;

  return (
    <div className="space-y-4">
      {/* Split mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={splitMode === "even" ? "default" : "outline"}
          size="sm"
          onClick={() => setSplitMode("even")}
        >
          <Users className="h-4 w-4 mr-1" />
          Split Evenly
        </Button>
        <Button
          type="button"
          variant={splitMode === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => setSplitMode("custom")}
        >
          <Calculator className="h-4 w-4 mr-1" />
          Custom Amounts
        </Button>
      </div>

      {/* Quick select buttons */}
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={selectAll}
          className="text-primary hover:underline"
        >
          Select all
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          type="button"
          onClick={selectNone}
          className="text-primary hover:underline"
        >
          Select none
        </button>
      </div>

      {/* Member list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {members
          .filter((m) => m.id !== currentUserId)
          .map((member) => {
            const isSelected = selectedMembers.has(member.id);
            const evenAmount =
              selectedMembers.size > 0
                ? totalAmount / selectedMembers.size
                : 0;

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <Checkbox
                  id={`member-${member.id}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleMember(member.id)}
                />
                <Label
                  htmlFor={`member-${member.id}`}
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(member.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {member.display_name || member.email}
                  </span>
                </Label>

                {splitMode === "even" && isSelected && (
                  <span className="text-sm text-muted-foreground">
                    ${evenAmount.toFixed(2)}
                  </span>
                )}

                {splitMode === "custom" && isSelected && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={customAmounts[member.id] || ""}
                      onChange={(e) =>
                        handleCustomAmountChange(member.id, e.target.value)
                      }
                      placeholder="0.00"
                      className="w-20 h-8 text-right"
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Summary */}
      {splitMode === "custom" && selectedMembers.size > 0 && (
        <div
          className={`p-3 rounded-lg ${
            Math.abs(remainingAmount) < 0.01
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-amber-100 dark:bg-amber-900/30"
          }`}
        >
          <div className="flex justify-between text-sm">
            <span>Total assigned:</span>
            <span className="font-medium">${customTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Expense total:</span>
            <span className="font-medium">${totalAmount.toFixed(2)}</span>
          </div>
          {Math.abs(remainingAmount) >= 0.01 && (
            <div className="flex justify-between text-sm mt-1 pt-1 border-t">
              <span className="font-medium">Remaining:</span>
              <span
                className={`font-medium ${
                  remainingAmount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                ${remainingAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {selectedMembers.size === 0 && (
        <p className="text-sm text-red-500">
          Please select at least one person to split with
        </p>
      )}
    </div>
  );
}
