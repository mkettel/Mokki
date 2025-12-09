"use client";

import { useState, useTransition } from "react";
import { WeatherReport } from "@/types/database";
import { ResortWeatherCard } from "./resort-weather-card";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, RefreshCw, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateHouseFavoriteResorts } from "@/lib/actions/resorts";
import { cn } from "@/lib/utils";

interface WeatherGridProps {
  reports: WeatherReport[];
  onResortClick?: (resortId: string) => void;
  selectedResortId?: string | null;
  houseId?: string;
}

interface SortableResortCardProps {
  report: WeatherReport;
  isSelected: boolean;
  onClick: () => void;
}

function SortableResortCard({ report, isSelected, onClick }: SortableResortCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: report.resort.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer relative group touch-none",
        isSelected && "ring-2 ring-primary rounded-lg",
        isDragging && "opacity-40 scale-[0.98]"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-md bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div onClick={onClick}>
        <ResortWeatherCard report={report} compact />
      </div>
    </div>
  );
}

export function WeatherGrid({
  reports,
  onResortClick,
  selectedResortId,
  houseId,
}: WeatherGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localReports, setLocalReports] = useState(reports);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update local reports when props change
  if (reports !== localReports && reports.length !== localReports.length) {
    setLocalReports(reports);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = localReports.findIndex((r) => r.resort.id === active.id);
      const newIndex = localReports.findIndex((r) => r.resort.id === over.id);

      const newReports = arrayMove(localReports, oldIndex, newIndex);
      setLocalReports(newReports);

      // Save the new order
      if (houseId) {
        const newOrder = newReports.map((r) => r.resort.id);
        startTransition(async () => {
          await updateHouseFavoriteResorts(houseId, newOrder);
        });
      }
    }
  };

  const activeReport = activeId
    ? localReports.find((r) => r.resort.id === activeId)
    : null;

  if (localReports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Mountain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Resorts Selected</h3>
          <p className="text-muted-foreground">
            Add some favorite resorts to see their weather conditions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {localReports.length} resort{localReports.length !== 1 ? "s" : ""} · drag to reorder
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localReports.map((r) => r.resort.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {localReports.map((report) => (
              <SortableResortCard
                key={report.resort.id}
                report={report}
                isSelected={selectedResortId === report.resort.id}
                onClick={() => onResortClick?.(report.resort.id)}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}>
          {activeReport ? (
            <div className="shadow-2xl rounded-lg scale-105 rotate-2 opacity-95">
              <ResortWeatherCard report={activeReport} compact />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
