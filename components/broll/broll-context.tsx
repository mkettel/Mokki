"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  BRollMedia,
  BRollMediaWithProfile,
  BRollMediaGroupedByDay,
  Profile,
} from "@/types/database";
import { format, isToday, isYesterday } from "date-fns";

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

interface BRollContextValue {
  items: BRollMediaWithProfile[];
  grouped: BRollMediaGroupedByDay[];
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  addItems: (newItems: BRollMedia[], profile: Profile) => void;
  appendItems: (newItems: BRollMediaWithProfile[]) => void;
  removeItem: (itemId: string) => void;
  updateItemCaption: (itemId: string, caption: string | null) => void;
}

const BRollContext = createContext<BRollContextValue | null>(null);

export function useBRollContext() {
  const context = useContext(BRollContext);
  if (!context) {
    throw new Error("useBRollContext must be used within a BRollProvider");
  }
  return context;
}

interface BRollProviderProps {
  children: ReactNode;
  initialItems: BRollMediaWithProfile[];
  initialGrouped: BRollMediaGroupedByDay[];
  initialHasMore: boolean;
}

export function BRollProvider({
  children,
  initialItems,
  initialGrouped,
  initialHasMore,
}: BRollProviderProps) {
  const [items, setItems] = useState(initialItems);
  const [grouped, setGrouped] = useState(initialGrouped);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const regroupItems = useCallback((allItems: BRollMediaWithProfile[]) => {
    const groups: Map<string, BRollMediaWithProfile[]> = new Map();

    for (const item of allItems) {
      const date = format(new Date(item.created_at), "yyyy-MM-dd");
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(item);
    }

    return Array.from(groups.entries())
      .map(([date, items]) => ({
        date,
        displayDate: formatDisplayDate(date),
        items,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const addItems = useCallback(
    (newItems: BRollMedia[], profile: Profile) => {
      const newItemsWithProfile: BRollMediaWithProfile[] = newItems.map((item) => ({
        ...item,
        profiles: profile,
      }));

      setItems((prev) => {
        const updated = [...newItemsWithProfile, ...prev];
        setGrouped(regroupItems(updated));
        return updated;
      });
    },
    [regroupItems]
  );

  const appendItems = useCallback(
    (newItems: BRollMediaWithProfile[]) => {
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const uniqueNewItems = newItems.filter((i) => !existingIds.has(i.id));
        const updated = [...prev, ...uniqueNewItems];
        setGrouped(regroupItems(updated));
        return updated;
      });
    },
    [regroupItems]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const updated = prev.filter((i) => i.id !== itemId);
        setGrouped(regroupItems(updated));
        return updated;
      });
    },
    [regroupItems]
  );

  const updateItemCaption = useCallback(
    (itemId: string, caption: string | null) => {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === itemId ? { ...item, caption } : item
        );
        setGrouped(regroupItems(updated));
        return updated;
      });
    },
    [regroupItems]
  );

  return (
    <BRollContext.Provider
      value={{
        items,
        grouped,
        hasMore,
        setHasMore,
        addItems,
        appendItems,
        removeItem,
        updateItemCaption,
      }}
    >
      {children}
    </BRollContext.Provider>
  );
}
