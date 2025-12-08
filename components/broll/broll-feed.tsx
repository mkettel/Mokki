"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBRollMedia } from "@/lib/actions/broll";
import { BRollDayGroup } from "./broll-day-group";
import { Loader2 } from "lucide-react";
import { useBRollContext } from "./broll-context";

interface BRollFeedProps {
  houseId: string;
  currentUserId: string;
}

export function BRollFeed({ houseId, currentUserId }: BRollFeedProps) {
  const { items, grouped, hasMore, setHasMore, appendItems } =
    useBRollContext();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const result = await getBRollMedia(houseId, {
      offset: items.length,
    });

    if (!result.error) {
      appendItems(result.items);
      setHasMore(result.hasMore);
    }
    setIsLoading(false);
  }, [houseId, items.length, hasMore, appendItems, setHasMore, isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-black dark:text-foreground text-lg">
          No photos or videos yet.
        </p>
        <p className="text-black dark:text-foreground text-sm mt-1">
          Upload your first memories to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {grouped.map((group) => (
        <BRollDayGroup
          key={group.date}
          group={group}
          currentUserId={currentUserId}
        />
      ))}

      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isLoading && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
