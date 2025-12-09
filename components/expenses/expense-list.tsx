"use client";

import { useState } from "react";
import { ExpenseCard } from "./expense-card";
import { EditExpenseDialog } from "./edit-expense-dialog";
import type { ExpenseWithDetails, Profile } from "@/types/database";

interface ExpenseListProps {
  expenses: ExpenseWithDetails[];
  currentUserId: string;
  houseId: string;
  members: (Profile & { memberId: string })[];
}

export function ExpenseList({
  expenses,
  currentUserId,
  houseId,
  members,
}: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(
    null
  );

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No expenses yet.</p>
        <p className="text-sm mt-1">Add an expense to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            currentUserId={currentUserId}
            onEdit={(exp) => setEditingExpense(exp)}
          />
        ))}
      </div>

      <EditExpenseDialog
        expense={editingExpense}
        houseId={houseId}
        members={members}
        currentUserId={currentUserId}
        open={editingExpense !== null}
        onOpenChange={(open) => {
          if (!open) setEditingExpense(null);
        }}
      />
    </>
  );
}
