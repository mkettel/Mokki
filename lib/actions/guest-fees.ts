"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { GUEST_FEE_PER_NIGHT } from "@/lib/constants";
import type { UserGuestFeeSummary } from "@/types/database";

// Get user's guest fee summary for a specific house
export async function getUserGuestFeesSummary(houseId: string): Promise<{
  summary: UserGuestFeeSummary | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { summary: null, error: "Not authenticated" };
  }

  // Get all stays with guests for this user in this house
  const { data: stays, error: staysError } = await supabase
    .from("stays")
    .select("id, guest_count, linked_expense_id")
    .eq("user_id", user.id)
    .eq("house_id", houseId)
    .gt("guest_count", 0);

  if (staysError) {
    console.error("Error fetching stays:", staysError);
    return { summary: null, error: "Failed to fetch stays" };
  }

  // Calculate totals
  let totalStays = 0;
  let totalGuests = 0;
  let totalAmount = 0;
  let settledAmount = 0;
  let unsettledAmount = 0;

  for (const stay of stays || []) {
    if (stay.guest_count > 0) {
      totalStays++;
      totalGuests += stay.guest_count;

      if (stay.linked_expense_id) {
        // Fetch expense and splits separately
        const { data: expense } = await supabase
          .from("expenses")
          .select(
            `
            id,
            amount,
            expense_splits (
              id,
              amount,
              settled,
              user_id
            )
          `
          )
          .eq("id", stay.linked_expense_id)
          .single();

        if (expense) {
          const userSplit = expense.expense_splits.find(
            (s) => s.user_id === user.id
          );
          if (userSplit) {
            totalAmount += userSplit.amount;
            if (userSplit.settled) {
              settledAmount += userSplit.amount;
            } else {
              unsettledAmount += userSplit.amount;
            }
          }
        }
      }
    }
  }

  return {
    summary: {
      totalStays,
      totalGuests,
      totalAmount,
      settledAmount,
      unsettledAmount,
    },
    error: null,
  };
}

// Type for stay with house and expense info
type StayWithHouseAndExpense = {
  id: string;
  house_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  notes: string | null;
  guest_count: number;
  linked_expense_id: string | null;
  created_at: string;
  houses: {
    id: string;
    name: string;
  } | null;
  expenses: {
    id: string;
    amount: number;
    expense_splits: {
      id: string;
      user_id: string;
      amount: number;
      settled: boolean;
      settled_at: string | null;
    }[];
  } | null;
};

// Get all stays with guest fees for a user in a specific house (for account page)
export async function getUserStaysWithGuestFees(houseId: string): Promise<{
  stays: StayWithHouseAndExpense[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { stays: [], error: "Not authenticated" };
  }

  const { data: stays, error } = await supabase
    .from("stays")
    .select(
      `
      *,
      houses (
        id,
        name
      )
    `
    )
    .eq("user_id", user.id)
    .eq("house_id", houseId)
    .gt("guest_count", 0)
    .order("check_in", { ascending: false });

  if (error) {
    console.error("Error fetching stays with guest fees:", error);
    return { stays: [], error: error.message };
  }

  // Fetch expenses separately for each stay
  const staysWithExpenses: StayWithHouseAndExpense[] = await Promise.all(
    (stays || []).map(async (stay) => {
      let expenses = null;

      if (stay.linked_expense_id) {
        const { data: expense } = await supabase
          .from("expenses")
          .select(
            `
            id,
            amount,
            expense_splits (
              id,
              user_id,
              amount,
              settled,
              settled_at
            )
          `
          )
          .eq("id", stay.linked_expense_id)
          .single();

        expenses = expense;
      }

      return {
        ...stay,
        expenses,
      } as StayWithHouseAndExpense;
    })
  );

  return { stays: staysWithExpenses, error: null };
}

// Settle a guest fee (mark expense split as paid)
export async function settleGuestFee(splitId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify the split belongs to the user
  const { data: split, error: fetchError } = await supabase
    .from("expense_splits")
    .select("*, expenses!inner(category)")
    .eq("id", splitId)
    .single();

  if (fetchError || !split) {
    console.error("Error fetching split:", fetchError);
    return { error: "Expense split not found" };
  }

  // Only allow settling own splits or if user is house admin
  if (split.user_id !== user.id) {
    return { error: "You can only settle your own expenses" };
  }

  const { error } = await supabase
    .from("expense_splits")
    .update({
      settled: true,
      settled_at: new Date().toISOString(),
    })
    .eq("id", splitId);

  if (error) {
    console.error("Error settling expense:", error);
    return { error: "Failed to settle expense" };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/account");
  return { error: null };
}

// Unsettle a guest fee (mark as unpaid)
export async function unsettleGuestFee(splitId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: split, error: fetchError } = await supabase
    .from("expense_splits")
    .select("user_id")
    .eq("id", splitId)
    .single();

  if (fetchError || !split) {
    return { error: "Expense split not found" };
  }

  if (split.user_id !== user.id) {
    return { error: "You can only modify your own expenses" };
  }

  const { error } = await supabase
    .from("expense_splits")
    .update({
      settled: false,
      settled_at: null,
    })
    .eq("id", splitId);

  if (error) {
    console.error("Error unsettling expense:", error);
    return { error: "Failed to unsettle expense" };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/account");
  return { error: null };
}
