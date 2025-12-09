import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveHouse } from "@/lib/actions/house";
import { getHouseExpenses, getUserBalances, getHouseMembers } from "@/lib/actions/expenses";
import { ExpenseSummaryCards } from "@/components/expenses/expense-summary-cards";
import { BalanceList } from "@/components/expenses/balance-list";
import { ExpenseList } from "@/components/expenses/expense-list";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { house: activeHouse } = await getActiveHouse();

  if (!activeHouse) {
    redirect("/create-house");
  }

  // Fetch all data in parallel
  const [
    { expenses },
    { data: balanceData },
    { members },
  ] = await Promise.all([
    getHouseExpenses(activeHouse.id),
    getUserBalances(activeHouse.id),
    getHouseMembers(activeHouse.id),
  ]);

  const summary = balanceData?.summary || {
    totalYouOwe: 0,
    totalYouAreOwed: 0,
    netBalance: 0,
  };

  const balances = balanceData?.balances || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl uppercase font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Track shared costs and settle up
          </p>
        </div>
        <AddExpenseDialog
          houseId={activeHouse.id}
          members={members}
          currentUserId={user.id}
        />
      </div>

      <ExpenseSummaryCards summary={summary} />

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="expenses">All Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-6">
          <BalanceList balances={balances} houseId={activeHouse.id} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpenseList
            expenses={expenses}
            currentUserId={user.id}
            houseId={activeHouse.id}
            members={members}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
