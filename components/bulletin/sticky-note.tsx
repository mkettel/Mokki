"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wifi, Shield, Phone, MapPin, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BulletinCategory, BulletinItemWithProfile, BulletinStyle } from "@/types/database";
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

// Style-specific container classes
const styleContainerClasses: Record<BulletinStyle, string> = {
  sticky: "rounded-sm",
  paper: "rounded-none",
  sticker: "rounded-2xl",
  keychain: "rounded-xl",
};

// Tape decoration for sticky notes
function TapeDecoration() {
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/60 rounded-sm shadow-sm" />
  );
}

// Paper clip decoration for paper notes
function PaperClipDecoration() {
  return (
    <svg
      className="absolute -top-3 right-4 w-6 h-10 drop-shadow-sm"
      viewBox="0 0 24 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C7.58 2 4 5.58 4 10V30C4 34.42 7.58 38 12 38C16.42 38 20 34.42 20 30V10"
        stroke="#9CA3AF"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 8C9.79 8 8 9.79 8 12V28C8 30.21 9.79 32 12 32C14.21 32 16 30.21 16 28V12"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Glossy shine overlay for stickers
function GlossyOverlay() {
  return (
    <>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
      {/* Peeled corner effect */}
      <div className="absolute bottom-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-black/10 to-transparent transform rotate-45 translate-x-4 translate-y-4" />
      </div>
    </>
  );
}

// Keychain hole and ring decoration
function KeychainDecoration() {
  return (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
      {/* Ring */}
      <svg className="w-8 h-6 drop-shadow-sm" viewBox="0 0 32 24" fill="none">
        <ellipse
          cx="16"
          cy="8"
          rx="10"
          ry="6"
          stroke="#9CA3AF"
          strokeWidth="3"
          fill="none"
        />
      </svg>
      {/* Hole */}
      <div className="w-4 h-4 rounded-full bg-background border-2 border-gray-400 -mt-3 shadow-inner" />
    </div>
  );
}

// Get decoration component based on style
function StyleDecoration({ style }: { style: BulletinStyle }) {
  switch (style) {
    case "sticky":
      return <TapeDecoration />;
    case "paper":
      return <PaperClipDecoration />;
    case "sticker":
      return <GlossyOverlay />;
    case "keychain":
      return <KeychainDecoration />;
    default:
      return <TapeDecoration />;
  }
}

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
  const style = (item.style as BulletinStyle) || "sticky";
  const containerClass = styleContainerClasses[style];

  // Style-specific adjustments
  const needsTopPadding = style === "keychain"; // Extra padding for keychain hole

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
        "group relative p-4 min-h-[180px] shadow-md transition-shadow",
        containerClass,
        colors.bg,
        colors.text,
        needsTopPadding && "pt-6"
      )}
      style={{
        boxShadow:
          "2px 3px 8px rgba(0,0,0,0.1), -1px -1px 0 rgba(255,255,255,0.5) inset",
      }}
    >
      {/* Style-specific decoration */}
      <StyleDecoration style={style} />

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
      <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-a:underline hover:prose-a:opacity-70 break-words overflow-hidden">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all"
              >
                {children}
              </a>
            ),
          }}
        >
          {item.content}
        </ReactMarkdown>
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
