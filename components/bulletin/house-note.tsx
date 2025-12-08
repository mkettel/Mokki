"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HouseNoteWithEditor } from "@/types/database";
import { updateHouseNote } from "@/lib/actions/house-note";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HouseNoteProps {
  note: HouseNoteWithEditor | null;
  houseId: string;
}

export function HouseNote({ note, houseId }: HouseNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note?.content || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateHouseNote(houseId, content);
      if (!result.error) {
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    setContent(note?.content || "");
    setIsEditing(false);
  };

  const isEmpty = !note?.content?.trim();

  return (
    <div
      className={cn(
        "relative flex flex-col",
        "bg-white dark:bg-gray-100",
        "border border-gray-200 dark:border-gray-300",
        "shadow-md",
        "rounded-sm",
        "min-h-[400px]",
        "overflow-hidden"
      )}
      style={{
        backgroundImage:
          "linear-gradient(to bottom, transparent 0px, transparent 27px, #e5e5e5 28px)",
        backgroundSize: "100% 28px",
      }}
    >
      {/* Paper holes decoration */}
      <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-400" />
      <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-400" />

      {/* Header with title and edit button */}
      <div className="flex items-center justify-between px-6 pt-8 pb-2 border-b border-red-300">
        <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-wide">
          House Notes
        </h3>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 p-6 pt-4">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={cn(
              "w-full h-full min-h-[280px]",
              "bg-transparent",
              "border-none outline-none resize-none",
              "text-gray-800 text-sm leading-7",
              "placeholder:text-gray-400"
            )}
            placeholder="Leave a note for the house...

Use markdown for formatting:
**bold**, *italic*, - bullet lists"
            autoFocus
          />
        ) : isEmpty ? (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full h-full min-h-[280px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <span className="text-center">
              <Pencil className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <span className="text-sm">Click to add a note for the house</span>
            </span>
          </button>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-p:whitespace-pre-wrap prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 text-gray-800 leading-7 whitespace-pre-wrap break-words overflow-hidden">
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
              {note?.content || ""}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Footer with last edited info */}
      {note?.updated_by && note?.profiles && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 dark:bg-gray-100">
          <p className="text-xs text-gray-500">
            Last edited by{" "}
            <span className="font-medium">
              {note.profiles.display_name?.split(" ")[0] || "Unknown"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
