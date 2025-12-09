"use client";

import { motion } from "framer-motion";
import { ExpenseSummaryCards } from "./expense-summary-cards";
import { BalanceList } from "./balance-list";
import { ExpenseList } from "./expense-list";
import { AddExpenseDialog } from "./add-expense-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExpenseSummary, UserBalance, ExpenseWithDetails, Profile } from "@/types/database";

interface ExpensesContentProps {
  summary: ExpenseSummary;
  balances: UserBalance[];
  expenses: ExpenseWithDetails[];
  members: (Profile & { memberId: string })[];
  houseId: string;
  currentUserId: string;
}

export function ExpensesContent({
  summary,
  balances,
  expenses,
  members,
  houseId,
  currentUserId,
}: ExpensesContentProps) {
  return (
    <div className="space-y-6">
      {/* Header with title and add button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl uppercase font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Track shared costs and settle up
          </p>
        </div>
        <AddExpenseDialog
          houseId={houseId}
          members={members}
          currentUserId={currentUserId}
        />
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <ExpenseSummaryCards summary={summary} />
      </motion.div>

      {/* Tabs section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <Tabs defaultValue="balances" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="balances" className="mt-6">
            <BalanceList balances={balances} houseId={houseId} />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <ExpenseList
              expenses={expenses}
              currentUserId={currentUserId}
              houseId={houseId}
              members={members}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
