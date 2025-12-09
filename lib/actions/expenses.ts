"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendExpenseTaggedEmail } from "@/lib/email/resend";
import type {
  ExpenseCategory,
  ExpenseWithDetails,
  ExpenseBalanceData,
  UserBalance,
  ExpenseSummary,
  Profile,
} from "@/types/database";

// Helper function to format currency amounts
function formatAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// Get accepted house members with profiles (for split selection)
export async function getHouseMembers(houseId: string): Promise<{
  members: (Profile & { memberId: string })[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { members: [], error: "Not authenticated" };
  }

  const { data: members, error } = await supabase
    .from("house_members")
    .select(
      `
      id,
      user_id,
      profiles (
        id,
        email,
        display_name,
        avatar_url,
        venmo_handle
      )
    `
    )
    .eq("house_id", houseId)
    .eq("invite_status", "accepted")
    .not("user_id", "is", null);

  if (error) {
    console.error("Error fetching house members:", error);
    return { members: [], error: "Failed to fetch members" };
  }

  const formattedMembers = (members || [])
    .filter((m) => m.profiles)
    .map((m) => ({
      ...(m.profiles as Profile),
      memberId: m.id,
    }));

  return { members: formattedMembers, error: null };
}

// Create a new expense with splits
export async function createExpense(formData: FormData): Promise<{
  expense?: ExpenseWithDetails;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Parse form data
  const houseId = formData.get("house_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as ExpenseCategory;
  const date = formData.get("date") as string;
  const splitsJson = formData.get("splits") as string;

  // Validate required fields
  if (!houseId) return { error: "House ID is required" };
  if (!title || title.trim().length === 0) return { error: "Title is required" };
  if (isNaN(amount) || amount <= 0) return { error: "Amount must be greater than 0" };
  if (!date) return { error: "Date is required" };
  if (!splitsJson) return { error: "At least one split is required" };

  // Parse and validate splits
  let splits: { userId: string; amount: number }[];
  try {
    splits = JSON.parse(splitsJson);
  } catch {
    return { error: "Invalid splits data" };
  }

  if (!Array.isArray(splits) || splits.length === 0) {
    return { error: "At least one split is required" };
  }

  // Validate split amounts sum to total (with small tolerance for floating point)
  const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(splitTotal - amount) > 0.01) {
    return { error: `Split amounts ($${splitTotal.toFixed(2)}) must equal total ($${amount.toFixed(2)})` };
  }

  // Verify user is a member of the house
  const { data: membership } = await supabase
    .from("house_members")
    .select("id")
    .eq("house_id", houseId)
    .eq("user_id", user.id)
    .eq("invite_status", "accepted")
    .single();

  if (!membership) {
    return { error: "You are not a member of this house" };
  }

  // Create the expense
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      house_id: houseId,
      paid_by: user.id,
      created_by: user.id,
      title: title.trim(),
      description: description?.trim() || "",
      amount: formatAmount(amount),
      category: category || "other",
      date,
    })
    .select()
    .single();

  if (expenseError) {
    console.error("Error creating expense:", expenseError);
    return { error: "Failed to create expense" };
  }

  // Create expense splits
  const splitInserts = splits.map((split) => ({
    expense_id: expense.id,
    user_id: split.userId,
    amount: formatAmount(split.amount),
    settled: false,
  }));

  const { error: splitsError } = await supabase
    .from("expense_splits")
    .insert(splitInserts);

  if (splitsError) {
    console.error("Error creating expense splits:", splitsError);
    // Clean up the expense if splits failed
    await supabase.from("expenses").delete().eq("id", expense.id);
    return { error: "Failed to create expense splits" };
  }

  // Send email notifications to tagged users (async, don't wait)
  sendExpenseNotifications({
    supabase,
    houseId,
    expenseId: expense.id,
    expenseTitle: title.trim(),
    expenseAmount: amount,
    payerId: user.id,
    splits,
  }).catch((err) => {
    console.error("Error sending expense notifications:", err);
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/account");

  // Return the created expense with details
  const { expense: fullExpense } = await getExpenseById(expense.id);
  return { expense: fullExpense };
}

// Helper function to send email notifications
async function sendExpenseNotifications({
  supabase,
  houseId,
  expenseId,
  expenseTitle,
  expenseAmount,
  payerId,
  splits,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  houseId: string;
  expenseId: string;
  expenseTitle: string;
  expenseAmount: number;
  payerId: string;
  splits: { userId: string; amount: number }[];
}) {
  // Get house name
  const { data: house } = await supabase
    .from("houses")
    .select("name")
    .eq("id", houseId)
    .single();

  // Get payer profile
  const { data: payer } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", payerId)
    .single();

  const payerName = payer?.display_name || payer?.email || "Someone";
  const houseName = house?.name || "your house";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mokki.app";
  const expenseUrl = `${baseUrl}/dashboard/expenses`;

  // Get profiles for all split recipients
  const recipientIds = splits.map((s) => s.userId).filter((id) => id !== payerId);

  if (recipientIds.length === 0) return;

  const { data: recipients } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in("id", recipientIds);

  if (!recipients || recipients.length === 0) return;

  // Send emails in parallel
  const emailPromises = recipients.map(async (recipient) => {
    const split = splits.find((s) => s.userId === recipient.id);
    if (!split) return;

    try {
      await sendExpenseTaggedEmail({
        to: recipient.email,
        recipientName: recipient.display_name || "",
        payerName,
        expenseTitle,
        totalAmount: expenseAmount,
        yourShare: split.amount,
        houseName,
        expenseUrl,
      });
    } catch (err) {
      console.error(`Failed to send email to ${recipient.email}:`, err);
    }
  });

  await Promise.allSettled(emailPromises);
}

// Get a single expense with all details
export async function getExpenseById(expenseId: string): Promise<{
  expense?: ExpenseWithDetails;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      paid_by_profile:profiles!expenses_paid_by_fkey (
        id,
        email,
        display_name,
        avatar_url,
        venmo_handle
      ),
      created_by_profile:profiles!expenses_created_by_fkey (
        id,
        email,
        display_name,
        avatar_url,
        venmo_handle
      ),
      expense_splits (
        id,
        user_id,
        amount,
        settled,
        settled_at,
        profiles (
          id,
          email,
          display_name,
          avatar_url,
          venmo_handle
        )
      )
    `
    )
    .eq("id", expenseId)
    .single();

  if (error) {
    console.error("Error fetching expense:", error);
    return { error: "Expense not found" };
  }

  return { expense: expense as unknown as ExpenseWithDetails };
}

// Get all expenses for a house
export async function getHouseExpenses(
  houseId: string,
  options?: {
    limit?: number;
    offset?: number;
    category?: ExpenseCategory;
  }
): Promise<{
  expenses: ExpenseWithDetails[];
  hasMore: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { expenses: [], hasMore: false, error: "Not authenticated" };
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      paid_by_profile:profiles!expenses_paid_by_fkey (
        id,
        email,
        display_name,
        avatar_url,
        venmo_handle
      ),
      created_by_profile:profiles!expenses_created_by_fkey (
        id,
        email,
        display_name,
        avatar_url,
        venmo_handle
      ),
      expense_splits (
        id,
        user_id,
        amount,
        settled,
        settled_at,
        profiles (
          id,
          email,
          display_name,
          avatar_url,
          venmo_handle
        )
      )
    `
    )
    .eq("house_id", houseId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  const { data: expenses, error } = await query;

  if (error) {
    console.error("Error fetching expenses:", error);
    return { expenses: [], hasMore: false, error: "Failed to fetch expenses" };
  }

  // Check if there are more results
  const hasMore = (expenses?.length || 0) > limit;
  const resultExpenses = hasMore ? expenses?.slice(0, limit) : expenses;

  return {
    expenses: (resultExpenses || []) as unknown as ExpenseWithDetails[],
    hasMore,
  };
}

// Update an expense (creator only)
export async function updateExpense(
  expenseId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify user is the creator
  const { data: expense } = await supabase
    .from("expenses")
    .select("created_by")
    .eq("id", expenseId)
    .single();

  if (!expense || expense.created_by !== user.id) {
    return { error: "Only the expense creator can edit this expense" };
  }

  // Parse form data
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as ExpenseCategory;
  const date = formData.get("date") as string;
  const splitsJson = formData.get("splits") as string;

  // Validate required fields
  if (!title || title.trim().length === 0) return { error: "Title is required" };
  if (isNaN(amount) || amount <= 0) return { error: "Amount must be greater than 0" };
  if (!date) return { error: "Date is required" };

  // Update the expense
  const { error: updateError } = await supabase
    .from("expenses")
    .update({
      title: title.trim(),
      description: description?.trim() || "",
      amount: formatAmount(amount),
      category: category || "other",
      date,
    })
    .eq("id", expenseId);

  if (updateError) {
    console.error("Error updating expense:", updateError);
    return { error: "Failed to update expense" };
  }

  // If splits were provided, update them
  if (splitsJson) {
    let splits: { userId: string; amount: number }[];
    try {
      splits = JSON.parse(splitsJson);
    } catch {
      return { error: "Invalid splits data" };
    }

    // Validate split amounts sum to total
    const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitTotal - amount) > 0.01) {
      return { error: `Split amounts must equal total` };
    }

    // Delete existing splits and create new ones
    await supabase.from("expense_splits").delete().eq("expense_id", expenseId);

    const splitInserts = splits.map((split) => ({
      expense_id: expenseId,
      user_id: split.userId,
      amount: formatAmount(split.amount),
      settled: false,
    }));

    const { error: splitsError } = await supabase
      .from("expense_splits")
      .insert(splitInserts);

    if (splitsError) {
      console.error("Error updating expense splits:", splitsError);
      return { error: "Failed to update expense splits" };
    }
  }

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/account");
  return {};
}

// Delete an expense (creator only)
export async function deleteExpense(expenseId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify user is the creator
  const { data: expense } = await supabase
    .from("expenses")
    .select("created_by, category, house_id")
    .eq("id", expenseId)
    .single();

  if (!expense) {
    return { error: "Expense not found" };
  }

  // Allow creator to delete, or admin for guest_fees
  if (expense.created_by !== user.id) {
    if (expense.category === "guest_fees") {
      const { data: membership } = await supabase
        .from("house_members")
        .select("role")
        .eq("house_id", expense.house_id)
        .eq("user_id", user.id)
        .single();

      if (membership?.role !== "admin") {
        return { error: "Only the expense creator can delete this expense" };
      }
    } else {
      return { error: "Only the expense creator can delete this expense" };
    }
  }

  // Delete receipt from storage if exists
  const { data: expenseData } = await supabase
    .from("expenses")
    .select("receipt_url")
    .eq("id", expenseId)
    .single();

  if (expenseData?.receipt_url) {
    // Extract storage path from URL and delete
    const urlParts = expenseData.receipt_url.split("/receipts/");
    if (urlParts.length > 1) {
      const storagePath = urlParts[1].split("?")[0];
      await supabase.storage.from("receipts").remove([storagePath]);
    }
  }

  // Delete the expense (splits will cascade delete)
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    console.error("Error deleting expense:", error);
    return { error: "Failed to delete expense" };
  }

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/account");
  return {};
}

// Calculate user balances for a house
export async function getUserBalances(houseId: string): Promise<{
  data?: ExpenseBalanceData;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get all house members with profiles
  const { data: members } = await supabase
    .from("house_members")
    .select(
      `
      user_id,
      profiles (
        id,
        display_name,
        avatar_url,
        venmo_handle
      )
    `
    )
    .eq("house_id", houseId)
    .eq("invite_status", "accepted")
    .not("user_id", "is", null);

  if (!members) {
    return { error: "Failed to fetch members" };
  }

  // Get all unsettled expense splits for this house
  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      `
      id,
      paid_by,
      amount,
      expense_splits (
        user_id,
        amount,
        settled
      )
    `
    )
    .eq("house_id", houseId);

  // Calculate balances for each member relative to current user
  const balances: UserBalance[] = [];
  let totalYouOwe = 0;
  let totalYouAreOwed = 0;

  for (const member of members) {
    if (!member.user_id || member.user_id === user.id) continue;

    const profile = member.profiles as Profile;
    let owes = 0; // What they owe current user
    let owed = 0; // What current user owes them

    for (const expense of expenses || []) {
      for (const split of expense.expense_splits || []) {
        if (split.settled) continue;

        // Current user paid, this member owes
        if (expense.paid_by === user.id && split.user_id === member.user_id) {
          owes += split.amount;
        }

        // This member paid, current user owes
        if (expense.paid_by === member.user_id && split.user_id === user.id) {
          owed += split.amount;
        }
      }
    }

    totalYouOwe += owed;
    totalYouAreOwed += owes;

    // Only include members with non-zero balances or all members
    balances.push({
      userId: member.user_id,
      displayName: profile?.display_name || null,
      avatarUrl: profile?.avatar_url || null,
      venmoHandle: profile?.venmo_handle || null,
      owes: formatAmount(owes),
      owed: formatAmount(owed),
      netBalance: formatAmount(owes - owed),
    });
  }

  const summary: ExpenseSummary = {
    totalYouOwe: formatAmount(totalYouOwe),
    totalYouAreOwed: formatAmount(totalYouAreOwed),
    netBalance: formatAmount(totalYouAreOwed - totalYouOwe),
  };

  return {
    data: {
      balances: balances.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance)),
      summary,
    },
  };
}

// Settle an expense split (mark as paid) - only expense payer can do this
export async function settleExpenseSplit(splitId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the split and verify the expense payer is the current user
  const { data: split, error: fetchError } = await supabase
    .from("expense_splits")
    .select(
      `
      id,
      expense_id,
      expenses!inner (
        paid_by
      )
    `
    )
    .eq("id", splitId)
    .single();

  if (fetchError || !split) {
    return { error: "Expense split not found" };
  }

  const expense = split.expenses as unknown as { paid_by: string };
  if (expense.paid_by !== user.id) {
    return { error: "Only the expense payer can mark splits as settled" };
  }

  const { error } = await supabase
    .from("expense_splits")
    .update({
      settled: true,
      settled_at: new Date().toISOString(),
    })
    .eq("id", splitId);

  if (error) {
    console.error("Error settling expense split:", error);
    return { error: "Failed to settle expense" };
  }

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/account");
  return {};
}

// Unsettle an expense split - only expense payer can do this
export async function unsettleExpenseSplit(splitId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the split and verify the expense payer is the current user
  const { data: split, error: fetchError } = await supabase
    .from("expense_splits")
    .select(
      `
      id,
      expense_id,
      expenses!inner (
        paid_by
      )
    `
    )
    .eq("id", splitId)
    .single();

  if (fetchError || !split) {
    return { error: "Expense split not found" };
  }

  const expense = split.expenses as unknown as { paid_by: string };
  if (expense.paid_by !== user.id) {
    return { error: "Only the expense payer can modify settlement status" };
  }

  const { error } = await supabase
    .from("expense_splits")
    .update({
      settled: false,
      settled_at: null,
    })
    .eq("id", splitId);

  if (error) {
    console.error("Error unsettling expense split:", error);
    return { error: "Failed to unsettle expense" };
  }

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/account");
  return {};
}

// Settle all splits with a specific user - only expense payer can do this
export async function settleAllWithUser(
  houseId: string,
  otherUserId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get all unsettled splits where current user paid and other user owes
  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      `
      id,
      expense_splits (
        id,
        user_id,
        settled
      )
    `
    )
    .eq("house_id", houseId)
    .eq("paid_by", user.id);

  const splitIdsToSettle: string[] = [];

  for (const expense of expenses || []) {
    for (const split of expense.expense_splits || []) {
      if (split.user_id === otherUserId && !split.settled) {
        splitIdsToSettle.push(split.id);
      }
    }
  }

  if (splitIdsToSettle.length === 0) {
    return {}; // Nothing to settle
  }

  const { error } = await supabase
    .from("expense_splits")
    .update({
      settled: true,
      settled_at: new Date().toISOString(),
    })
    .in("id", splitIdsToSettle);

  if (error) {
    console.error("Error settling all splits:", error);
    return { error: "Failed to settle expenses" };
  }

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/account");
  return {};
}

// Upload a receipt for an expense
export async function uploadReceipt(
  expenseId: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("receipt") as File;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "File must be an image (JPEG, PNG, WebP) or PDF" };
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File too large (max 10MB)" };
  }

  // Verify user is the creator
  const { data: expense } = await supabase
    .from("expenses")
    .select("created_by, house_id, receipt_url")
    .eq("id", expenseId)
    .single();

  if (!expense || expense.created_by !== user.id) {
    return { error: "Only the expense creator can upload receipts" };
  }

  // Delete existing receipt if present
  if (expense.receipt_url) {
    const urlParts = expense.receipt_url.split("/receipts/");
    if (urlParts.length > 1) {
      const storagePath = urlParts[1].split("?")[0];
      await supabase.storage.from("receipts").remove([storagePath]);
    }
  }

  // Generate storage path
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const storagePath = `${expense.house_id}/${expenseId}/${timestamp}.${fileExt}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading receipt:", uploadError);
    return { error: "Failed to upload receipt" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(storagePath);

  const receiptUrl = `${publicUrl}?t=${timestamp}`;

  // Update expense with receipt URL
  const { error: updateError } = await supabase
    .from("expenses")
    .update({ receipt_url: receiptUrl })
    .eq("id", expenseId);

  if (updateError) {
    console.error("Error updating expense with receipt:", updateError);
    // Clean up uploaded file
    await supabase.storage.from("receipts").remove([storagePath]);
    return { error: "Failed to save receipt" };
  }

  revalidatePath("/dashboard/expenses");
  return { url: receiptUrl };
}

// Delete a receipt from an expense
export async function deleteReceipt(expenseId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify user is the creator
  const { data: expense } = await supabase
    .from("expenses")
    .select("created_by, receipt_url")
    .eq("id", expenseId)
    .single();

  if (!expense || expense.created_by !== user.id) {
    return { error: "Only the expense creator can delete receipts" };
  }

  if (!expense.receipt_url) {
    return {}; // No receipt to delete
  }

  // Delete from storage
  const urlParts = expense.receipt_url.split("/receipts/");
  if (urlParts.length > 1) {
    const storagePath = urlParts[1].split("?")[0];
    await supabase.storage.from("receipts").remove([storagePath]);
  }

  // Update expense
  const { error } = await supabase
    .from("expenses")
    .update({ receipt_url: null })
    .eq("id", expenseId);

  if (error) {
    console.error("Error removing receipt from expense:", error);
    return { error: "Failed to remove receipt" };
  }

  revalidatePath("/dashboard/expenses");
  return {};
}
