import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveHouse } from "@/lib/actions/house";
import { getHouseExpenses, getUserBalances, getHouseMembers } from "@/lib/actions/expenses";
import { ExpensesContent } from "@/components/expenses/expenses-content";

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
    <ExpensesContent
      summary={summary}
      balances={balances}
      expenses={expenses}
      members={members}
      houseId={activeHouse.id}
      currentUserId={user.id}
    />
  );
}
