"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BRollMediaWithProfile } from "@/types/database";
import { Play } from "lucide-react";
import { BRollLightbox } from "./broll-lightbox";
import { formatDuration } from "@/lib/utils/media";

interface BRollMediaItemProps {
  item: BRollMediaWithProfile;
  index: number;
  isOwner: boolean;
}

export function BRollMediaItem({ item, index, isOwner }: BRollMediaItemProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isVideo = item.media_type === "video";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
        onClick={() => setIsLightboxOpen(true)}
      >
        {isVideo ? (
          <>
            <video
              src={item.public_url}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-black ml-0.5" fill="currentColor" />
              </div>
            </div>
            {item.duration && (
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                {formatDuration(item.duration)}
              </div>
            )}
          </>
        ) : (
          <img
            src={item.public_url}
            alt={item.caption || "Photo"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {item.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-xs line-clamp-2">{item.caption}</p>
          </div>
        )}
      </motion.div>

      <BRollLightbox
        item={item}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        isOwner={isOwner}
      />
    </>
  );
}
