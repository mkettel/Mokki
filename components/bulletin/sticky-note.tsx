"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wifi, Shield, Phone, MapPin, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BulletinCategory, BulletinItemWithProfile } from "@/types/database";
import { StickyNoteDialog } from "./sticky-note-dialog";
import { DeleteNoteButton } from "./delete-note-button";
import { cn } from "@/lib/utils";

const categoryConfig: Record<
  BulletinCategory,
  { icon: React.ReactNode; label: string }
> = {
  wifi: { icon: <Wifi className="h-3.5 w-3.5" />, label: "WiFi" },
  house_rules: { icon: <Shield className="h-3.5 w-3.5" />, label: "Rules" },
  emergency: { icon: <Phone className="h-3.5 w-3.5" />, label: "Emergency" },
  local_tips: { icon: <MapPin className="h-3.5 w-3.5" />, label: "Local Tips" },
};

// Generate a seeded random number from a string (item id)
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return ((hash % 1000) / 1000 + 1) % 1;
}

const noteColors: Record<string, { bg: string; text: string }> = {
  blue: {
    bg: "bg-[#C1AAC0] dark:bg-[#C1AAC0]",
    text: "text-amber-900",
  },
  beige: {
    bg: "bg-[#F6F5DF] dark:bg-[#F6F5DF]",
    text: "text-sky-900",
  },
  granite: {
    bg: "bg-[#3B5249] dark:bg-[#3B5249]",
    text: "text-[#F6F5DF]",
  },
  brown: {
    bg: "bg-[#895737] dark:bg-[#895737]",
    text: "text-[#F6F5DF]",
  },
  red: {
    bg: "bg-[#53131E] dark:bg-[#53131E]",
    text: "text-[#F6F5DF]",
  },
};

interface StickyNoteProps {
  item: BulletinItemWithProfile;
  houseId: string;
  index: number;
}

export function StickyNote({ item, houseId, index }: StickyNoteProps) {
  // Use item ID to generate consistent but random-looking rotation (-4 to 4 degrees)
  const rotation = useMemo(() => {
    const random = seededRandom(item.id);
    return (random - 0.5) * 8;
  }, [item.id]);

  const colors = noteColors[item.color] || noteColors.beige;
  const category = item.category ? categoryConfig[item.category] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{
        scale: 1.02,
        rotate: 0,
        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
      }}
      className={cn(
        "group relative p-4 min-h-[180px] rounded-sm shadow-md transition-shadow",
        colors.bg,
        colors.text
      )}
      style={{
        boxShadow:
          "2px 3px 8px rgba(0,0,0,0.1), -1px -1px 0 rgba(255,255,255,0.5) inset",
      }}
    >
      {/* Tape effect */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/60 rounded-sm shadow-sm" />

      {/* Category badge */}
      {category && (
        <div className="flex items-center gap-1.5 mb-2 opacity-70">
          {category.icon}
          <span className="text-xs font-medium uppercase tracking-wide">
            {category.label}
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold mb-2 leading-tight pr-16">{item.title}</h3>

      {/* Content with markdown */}
      <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
        <ReactMarkdown>{item.content}</ReactMarkdown>
      </div>

      {/* Edit/Delete buttons */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <StickyNoteDialog
          houseId={houseId}
          editItem={item}
          trigger={
            <button className="p-1.5 rounded bg-white/50 hover:bg-white/80 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          }
        />
        <DeleteNoteButton itemId={item.id} />
      </div>

      {/* Created by */}
      <div className="absolute bottom-2 left-4 text-xs opacity-50">
        {item.profiles?.display_name?.split(" ")[0] || "Unknown"}
      </div>
    </motion.div>
  );
}
