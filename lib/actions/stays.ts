"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { GUEST_FEE_PER_NIGHT } from "@/lib/constants";

// Helper function to calculate nights between two dates
function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// Helper function to get house admin (first admin by joined_at)
async function getHouseAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  houseId: string
): Promise<string | null> {
  const { data: admin } = await supabase
    .from("house_members")
    .select("user_id")
    .eq("house_id", houseId)
    .eq("role", "admin")
    .eq("invite_status", "accepted")
    .not("user_id", "is", null)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  return admin?.user_id ?? null;
}

// Type for stay with expense data
export type StayWithExpense = {
  id: string;
  house_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  notes: string | null;
  guest_count: number;
  linked_expense_id: string | null;
  created_at: string;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
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

export async function getHouseStays(houseId: string): Promise<{
  stays: StayWithExpense[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: stays, error } = await supabase
    .from("stays")
    .select(
      `
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `
    )
    .eq("house_id", houseId)
    .order("check_in", { ascending: true });

  if (error) {
    console.error("Error fetching stays:", error);
    return { stays: [], error: error.message };
  }

  // Fetch expenses separately for stays with linked expenses
  const staysWithExpenses: StayWithExpense[] = await Promise.all(
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
      } as StayWithExpense;
    })
  );

  return { stays: staysWithExpenses, error: null };
}

export async function createStay(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const houseId = formData.get("house_id") as string;
  const checkIn = formData.get("check_in") as string;
  const checkOut = formData.get("check_out") as string;
  const notes = formData.get("notes") as string | null;
  const guestCount = parseInt(formData.get("guest_count") as string) || 0;

  if (!houseId || !checkIn || !checkOut) {
    return { error: "Missing required fields" };
  }

  // Validate dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkOutDate < checkInDate) {
    return { error: "Check-out must be after check-in" };
  }

  // Calculate guest fee if applicable
  let linkedExpenseId: string | null = null;

  if (guestCount > 0) {
    const nights = calculateNights(checkIn, checkOut);
    const totalFee = guestCount * GUEST_FEE_PER_NIGHT * nights;

    if (totalFee > 0) {
      // Get house admin to set as paid_by (who is owed the money)
      const adminId = await getHouseAdmin(supabase, houseId);
      if (!adminId) {
        return { error: "No house admin found to assign guest fees" };
      }

      // Create the expense
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          house_id: houseId,
          paid_by: adminId,
          amount: totalFee,
          description: `Guest fees: ${guestCount} guest(s) × ${nights} night(s)`,
          category: "guest_fees",
          date: checkIn,
        })
        .select()
        .single();

      if (expenseError) {
        console.error("Error creating guest fee expense:", expenseError);
        return { error: "Failed to create guest fee expense" };
      }

      linkedExpenseId = expense.id;

      // Create expense split for the booking user
      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert({
          expense_id: expense.id,
          user_id: user.id,
          amount: totalFee,
          settled: false,
        });

      if (splitError) {
        console.error("Error creating expense split:", splitError);
        // Clean up the expense
        await supabase.from("expenses").delete().eq("id", expense.id);
        return { error: "Failed to create expense split" };
      }
    }
  }

  const { data: stay, error } = await supabase
    .from("stays")
    .insert({
      house_id: houseId,
      user_id: user.id,
      check_in: checkIn,
      check_out: checkOut,
      notes: notes?.trim() || null,
      guest_count: guestCount,
      linked_expense_id: linkedExpenseId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating stay:", error);
    // Clean up expense if stay creation failed
    if (linkedExpenseId) {
      await supabase.from("expenses").delete().eq("id", linkedExpenseId);
    }
    return { error: "Failed to create stay" };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/account");
  return { stay, error: null };
}

export async function updateStay(stayId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const checkIn = formData.get("check_in") as string;
  const checkOut = formData.get("check_out") as string;
  const notes = formData.get("notes") as string | null;
  const guestCount = parseInt(formData.get("guest_count") as string) || 0;

  // Validate dates
  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate < checkInDate) {
      return { error: "Check-out must be after check-in" };
    }
  }

  // Fetch existing stay to compare guest counts and get linked expense
  const { data: existingStay, error: fetchError } = await supabase
    .from("stays")
    .select("*, expenses:linked_expense_id (*)")
    .eq("id", stayId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existingStay) {
    console.error("Error fetching stay:", fetchError);
    return { error: "Stay not found or you don't have permission" };
  }

  const nights = calculateNights(checkIn, checkOut);
  const newTotalFee = guestCount * GUEST_FEE_PER_NIGHT * nights;
  let linkedExpenseId = existingStay.linked_expense_id;

  // Handle guest fee expense changes
  if (existingStay.guest_count === 0 && guestCount > 0 && newTotalFee > 0) {
    // Case 1: No guests before, guests now - create expense
    const adminId = await getHouseAdmin(supabase, existingStay.house_id);
    if (!adminId) {
      return { error: "No house admin found to assign guest fees" };
    }

    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        house_id: existingStay.house_id,
        paid_by: adminId,
        amount: newTotalFee,
        description: `Guest fees: ${guestCount} guest(s) × ${nights} night(s)`,
        category: "guest_fees",
        date: checkIn,
      })
      .select()
      .single();

    if (expenseError) {
      console.error("Error creating guest fee expense:", expenseError);
      return { error: "Failed to create guest fee expense" };
    }

    linkedExpenseId = expense.id;

    const { error: splitError } = await supabase.from("expense_splits").insert({
      expense_id: expense.id,
      user_id: user.id,
      amount: newTotalFee,
      settled: false,
    });

    if (splitError) {
      console.error("Error creating expense split:", splitError);
      await supabase.from("expenses").delete().eq("id", expense.id);
      return { error: "Failed to create expense split" };
    }
  } else if (
    existingStay.guest_count > 0 &&
    guestCount === 0 &&
    linkedExpenseId
  ) {
    // Case 2: Had guests before, no guests now - delete expense
    await supabase.from("expenses").delete().eq("id", linkedExpenseId);
    linkedExpenseId = null;
  } else if (guestCount > 0 && linkedExpenseId && newTotalFee > 0) {
    // Case 3: Guest count or dates changed - update expense
    const { error: updateExpenseError } = await supabase
      .from("expenses")
      .update({
        amount: newTotalFee,
        description: `Guest fees: ${guestCount} guest(s) × ${nights} night(s)`,
        date: checkIn,
      })
      .eq("id", linkedExpenseId);

    if (updateExpenseError) {
      console.error("Error updating expense:", updateExpenseError);
      return { error: "Failed to update guest fee expense" };
    }

    // Update the expense split amount
    const { error: updateSplitError } = await supabase
      .from("expense_splits")
      .update({ amount: newTotalFee })
      .eq("expense_id", linkedExpenseId)
      .eq("user_id", user.id);

    if (updateSplitError) {
      console.error("Error updating expense split:", updateSplitError);
      return { error: "Failed to update expense split" };
    }
  }

  const { error } = await supabase
    .from("stays")
    .update({
      check_in: checkIn,
      check_out: checkOut,
      notes: notes?.trim() || null,
      guest_count: guestCount,
      linked_expense_id: linkedExpenseId,
    })
    .eq("id", stayId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating stay:", error);
    return { error: "Failed to update stay" };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/account");
  return { error: null };
}

export async function deleteStay(stayId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch stay to get linked expense ID
  const { data: stay, error: fetchError } = await supabase
    .from("stays")
    .select("linked_expense_id")
    .eq("id", stayId)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching stay:", fetchError);
    return { error: "Stay not found or you don't have permission" };
  }

  // Delete linked expense first (cascade will delete splits)
  if (stay?.linked_expense_id) {
    await supabase.from("expenses").delete().eq("id", stay.linked_expense_id);
  }

  const { error } = await supabase
    .from("stays")
    .delete()
    .eq("id", stayId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting stay:", error);
    return { error: "Failed to delete stay" };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/account");
  return { error: null };
}

export async function getUpcomingStays(houseId: string, limit = 5): Promise<{
  stays: StayWithExpense[];
  error: string | null;
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: stays, error } = await supabase
    .from("stays")
    .select(
      `
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `
    )
    .eq("house_id", houseId)
    .gte("check_out", today)
    .order("check_in", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching upcoming stays:", error);
    return { stays: [], error: error.message };
  }

  // Fetch expenses separately for stays with linked expenses
  const staysWithExpenses: StayWithExpense[] = await Promise.all(
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
      } as StayWithExpense;
    })
  );

  return { stays: staysWithExpenses, error: null };
}

// Get a single stay with all details
export async function getStay(stayId: string): Promise<{
  stay: StayWithExpense | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: stay, error } = await supabase
    .from("stays")
    .select(
      `
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `
    )
    .eq("id", stayId)
    .single();

  if (error) {
    console.error("Error fetching stay:", error);
    return { stay: null, error: error.message };
  }

  // Fetch expense if linked
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
    stay: { ...stay, expenses } as StayWithExpense,
    error: null,
  };
}
