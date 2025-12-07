"use client";

import { BulletinItemWithProfile } from "@/types/database";
import { StickyNote } from "./sticky-note";

interface BulletinBoardGridProps {
  items: BulletinItemWithProfile[];
  houseId: string;
}

export function BulletinBoardGrid({ items, houseId }: BulletinBoardGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No notes yet. Add your first sticky note to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, index) => (
        <StickyNote key={item.id} item={item} houseId={houseId} index={index} />
      ))}
    </div>
  );
}
