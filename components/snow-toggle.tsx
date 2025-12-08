"use client";

import { Button } from "@/components/ui/button";
import { Snowflake } from "lucide-react";
import { useSnow } from "@/lib/snow-context";

const ICON_SIZE = 16;

export function SnowToggle() {
  const { enabled, toggle } = useSnow();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      title={enabled ? "Disable snow" : "Enable snow"}
    >
      <Snowflake
        size={ICON_SIZE}
        className={enabled ? "text-blue-400" : "text-muted-foreground"}
        fill={enabled ? "currentColor" : "none"}
      />
    </Button>
  );
}
