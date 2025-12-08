"use client";

import { BRollMediaGroupedByDay } from "@/types/database";
import { BRollMediaItem } from "./broll-media-item";

interface BRollDayGroupProps {
  group: BRollMediaGroupedByDay;
  currentUserId: string;
}

export function BRollDayGroup({ group, currentUserId }: BRollDayGroupProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-foreground/80">
        {group.displayDate}
      </h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {group.items.map((item, index) => (
          <BRollMediaItem
            key={item.id}
            item={item}
            index={index}
            isOwner={item.uploaded_by === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
