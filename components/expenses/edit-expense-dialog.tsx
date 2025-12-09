"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Upload, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateExpense, uploadReceipt, deleteReceipt } from "@/lib/actions/expenses";
import { MemberSplitSelector } from "./member-split-selector";
import type { Profile, ExpenseCategory, ExpenseWithDetails } from "@/types/database";

interface EditExpenseDialogProps {
  expense: ExpenseWithDetails | null;
  houseId: string;
  members: (Profile & { memberId: string })[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: "groceries", label: "Groceries" },
  { value: "utilities", label: "Utilities" },
  { value: "supplies", label: "Supplies" },
  { value: "rent", label: "Rent" },
  { value: "entertainment", label: "Entertainment" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

export function EditExpenseDialog({
  expense,
  houseId,
  members,
  currentUserId,
  open,
  onOpenChange,
}: EditExpenseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [splits, setSplits] = useState<{ userId: string; amount: number }[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);

  const router = useRouter();

  // Populate form when expense changes
  useEffect(() => {
    if (expense) {
      setTitle(expense.title || "");
      setAmount(expense.amount.toFixed(2));
      setCategory(expense.category);
      setDate(new Date(expense.date));
      setDescription(expense.description || "");
      setExistingReceiptUrl(expense.receipt_url);
      setReceiptFile(null);
      setError(null);

      // Set initial splits from expense
      const initialSplits = expense.expense_splits.map((s) => ({
        userId: s.user_id,
        amount: s.amount,
      }));
      setSplits(initialSplits);
    }
  }, [expense]);

  const handleSplitsChange = useCallback(
    (newSplits: { userId: string; amount: number }[]) => {
      setSplits(newSplits);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setError("File must be an image (JPEG, PNG, WebP) or PDF");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large (max 10MB)");
        return;
      }
      setReceiptFile(file);
      setExistingReceiptUrl(null);
      setError(null);
    }
  };

  const handleDeleteReceipt = async () => {
    if (!expense) return;
    setIsLoading(true);
    try {
      const result = await deleteReceipt(expense.id);
      if (result.error) {
        setError(result.error);
      } else {
        setExistingReceiptUrl(null);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    setError(null);
    setIsLoading(true);

    try {
      // Validate
      if (!title.trim()) {
        setError("Title is required");
        return;
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      if (splits.length === 0) {
        setError("Please select at least one person to split with");
        return;
      }

      // Check splits sum
      const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(splitTotal - amountNum) > 0.01) {
        setError(`Split amounts ($${splitTotal.toFixed(2)}) must equal total ($${amountNum.toFixed(2)})`);
        return;
      }

      // Update expense
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("amount", amountNum.toFixed(2));
      formData.append("category", category);
      formData.append("date", format(date, "yyyy-MM-dd"));
      formData.append("description", description.trim());
      formData.append("splits", JSON.stringify(splits));

      const result = await updateExpense(expense.id, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Upload new receipt if provided
      if (receiptFile) {
        const receiptFormData = new FormData();
        receiptFormData.append("receipt", receiptFile);
        const receiptResult = await uploadReceipt(expense.id, receiptFormData);
        if (receiptResult.error) {
          console.error("Receipt upload failed:", receiptResult.error);
        }
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("Error updating expense:", err);
      setError("Failed to update expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;

  // Get initial splits for the selector
  const initialSplits = expense?.expense_splits.map((s) => ({
    userId: s.user_id,
    amount: s.amount,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the expense details and splits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              placeholder="What was this expense for?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Amount and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="edit-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                      setAmount(val);
                    }
                  }}
                  disabled={isLoading}
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExpenseCategory)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Add any notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Receipt */}
          <div className="space-y-2">
            <Label>Receipt</Label>
            {existingReceiptUrl ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg">
                <a
                  href={existingReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-primary hover:underline truncate"
                >
                  View existing receipt
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteReceipt}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : receiptFile ? (
              <div className="flex items-center gap-2 p-2 border rounded-lg">
                <span className="flex-1 text-sm truncate">{receiptFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReceiptFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
              </div>
            )}
          </div>

          {/* Split selector */}
          <div className="space-y-2">
            <Label>Split With</Label>
            <MemberSplitSelector
              members={members}
              currentUserId={currentUserId}
              totalAmount={parsedAmount}
              onChange={handleSplitsChange}
              initialSplits={initialSplits}
            />
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
