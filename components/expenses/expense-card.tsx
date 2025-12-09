"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  Receipt,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import {
  deleteExpense,
  settleExpenseSplit,
  unsettleExpenseSplit,
} from "@/lib/actions/expenses";
import { VenmoHandle } from "./venmo-handle";
import type { ExpenseWithDetails, ExpenseCategory } from "@/types/database";

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  currentUserId: string;
  onEdit?: (expense: ExpenseWithDetails) => void;
}

const categoryColors: Record<ExpenseCategory, string> = {
  groceries:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  utilities: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  supplies:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  rent: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  entertainment:
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  transportation:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  guest_fees: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const categoryLabels: Record<ExpenseCategory, string> = {
  groceries: "Groceries",
  utilities: "Utilities",
  supplies: "Supplies",
  rent: "Rent",
  entertainment: "Entertainment",
  transportation: "Transportation",
  guest_fees: "Guest Fees",
  other: "Other",
};

export function ExpenseCard({
  expense,
  currentUserId,
  onEdit,
}: ExpenseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSplits, setShowSplits] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const router = useRouter();

  // Check if receipt is a PDF
  const isPdf = expense.receipt_url?.toLowerCase().includes(".pdf");

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 0.5);
      if (newZoom <= 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const isCreator = expense.created_by === currentUserId;
  const isPayer = expense.paid_by === currentUserId;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteExpense(expense.id);
      if (result.error) {
        console.error("Error deleting expense:", result.error);
      }
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSettle = async (splitId: string, isSettled: boolean) => {
    setSettlingId(splitId);
    try {
      if (isSettled) {
        await unsettleExpenseSplit(splitId);
      } else {
        await settleExpenseSplit(splitId);
      }
      router.refresh();
    } finally {
      setSettlingId(null);
    }
  };

  // Calculate how much current user owes/is owed for this expense
  const userSplit = expense.expense_splits.find(
    (s) => s.user_id === currentUserId
  );
  const unsettledSplits = expense.expense_splits.filter((s) => !s.settled);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">
                {expense.title || expense.description}
              </h3>
              <Badge
                variant="secondary"
                className={categoryColors[expense.category]}
              >
                {categoryLabels[expense.category]}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {format(new Date(expense.date), "MMM d, yyyy")}
              {expense.description && expense.title && (
                <span className="ml-2">- {expense.description}</span>
              )}
            </p>

            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={expense.paid_by_profile?.avatar_url || undefined}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(expense.paid_by_profile?.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-muted-foreground">
                  {expense.paid_by_profile?.display_name || "Unknown"} paid{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(expense.amount)}
                  </span>
                </span>
                {expense.paid_by_profile?.venmo_handle && (
                  <VenmoHandle handle={expense.paid_by_profile.venmo_handle} />
                )}
              </div>
            </div>

            {/* Show user's share if applicable */}
            {userSplit && !isPayer && (
              <p
                className={`text-sm mt-1 ${
                  userSplit.settled
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                Your share: {formatCurrency(userSplit.amount)}
                {userSplit.settled && " (Paid)"}
              </p>
            )}

            {/* Show outstanding balance if user is the payer */}
            {isPayer && unsettledSplits.length > 0 && (
              <p className="text-sm mt-1 text-amber-600 dark:text-amber-400">
                {unsettledSplits.length} unpaid bill
                {unsettledSplits.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {expense.receipt_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReceipt(true)}
                title="View receipt"
              >
                <Receipt className="h-4 w-4" />
              </Button>
            )}

            {isCreator && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(expense)}
                title="Edit expense"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {isCreator && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isDeleting}
                    title="Delete expense"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this expense? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Expandable splits section */}
        {expense.expense_splits.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={() => setShowSplits(!showSplits)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {showSplits ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              split with {expense.expense_splits.length} member
              {expense.expense_splits.length > 1 ? "s" : ""}
            </button>

            {showSplits && (
              <div className="mt-2 space-y-2">
                {expense.expense_splits.map((split) => (
                  <div
                    key={split.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={split.profiles?.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(split.profiles?.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>
                            {split.profiles?.display_name || "Unknown"}
                          </span>
                          <span className="text-muted-foreground">
                            owes {formatCurrency(split.amount)}
                          </span>
                        </div>
                        {split.profiles?.venmo_handle && (
                          <VenmoHandle handle={split.profiles.venmo_handle} />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {split.settled ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        >
                          Unpaid
                        </Badge>
                      )}

                      {/* Only payer can toggle settlement */}
                      {isPayer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleSettle(split.id, split.settled)
                          }
                          disabled={settlingId === split.id}
                          className="h-7 px-2"
                        >
                          {split.settled ? (
                            <X className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Receipt Viewer Dialog */}
        {expense.receipt_url && (
          <Dialog
            open={showReceipt}
            onOpenChange={(open) => {
              setShowReceipt(open);
              if (!open) resetZoom();
            }}
          >
            <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Receipt - {expense.title || expense.description}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(expense.receipt_url!, "_blank")}
                    className="mr-8"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </DialogTitle>
              </DialogHeader>

              {/* Zoom Controls - only for images */}
              {!isPdf && (
                <div className="flex items-center justify-center gap-2 py-2 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium w-16 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetZoom}
                    disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  {zoom > 1 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      Drag to pan
                    </span>
                  )}
                </div>
              )}

              <div
                className="flex items-center justify-center overflow-hidden max-h-[65vh] bg-muted/30 rounded-lg"
                onMouseDown={!isPdf ? handleMouseDown : undefined}
                onMouseMove={!isPdf ? handleMouseMove : undefined}
                onMouseUp={!isPdf ? handleMouseUp : undefined}
                onMouseLeave={!isPdf ? handleMouseUp : undefined}
                onWheel={!isPdf ? handleWheel : undefined}
                style={{
                  cursor:
                    zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
                }}
              >
                {isPdf ? (
                  <iframe
                    src={expense.receipt_url}
                    className="w-full h-[65vh] border rounded-lg"
                    title="Receipt PDF"
                  />
                ) : (
                  <img
                    src={expense.receipt_url}
                    alt="Receipt"
                    className="max-h-[65vh] object-contain rounded-lg select-none"
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${
                        pan.y / zoom
                      }px)`,
                      transition: isDragging
                        ? "none"
                        : "transform 0.1s ease-out",
                    }}
                    draggable={false}
                  />
                )}
              </div>

              {!isPdf && (
                <p className="text-xs text-muted-foreground text-center">
                  Use scroll wheel to zoom, drag to pan when zoomed in
                </p>
              )}
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
