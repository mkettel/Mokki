"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface VenmoHandleProps {
  handle: string;
  className?: string;
}

export function VenmoHandle({ handle, className = "" }: VenmoHandleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(handle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group ${className}`}
      title={copied ? "Copied!" : "Click to copy Venmo username"}
    >
      <span className="text-blue-500 dark:text-blue-400">@{handle}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
