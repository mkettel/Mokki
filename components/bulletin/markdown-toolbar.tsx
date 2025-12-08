"use client";

import { Bold, Italic, Link, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
  className,
}: MarkdownToolbarProps) {
  const insertMarkdown = (before: string, after: string, placeholder?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText: string;
    let newCursorPos: number;

    if (selectedText) {
      // Wrap selected text
      newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
      newCursorPos = start + before.length + selectedText.length + after.length;
    } else {
      // Insert placeholder
      const text = placeholder || "";
      newText = value.substring(0, start) + before + text + after + value.substring(end);
      newCursorPos = start + before.length + text.length;
    }

    onChange(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } else {
        // Select the placeholder text so user can type over it
        textarea.setSelectionRange(start + before.length, newCursorPos);
      }
    }, 0);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    // Check if selected text looks like a URL
    const isUrl = selectedText.match(/^https?:\/\//);

    let newText: string;
    let selectStart: number;
    let selectEnd: number;

    if (isUrl) {
      // Wrap URL in markdown link syntax
      newText = value.substring(0, start) + "[link](" + selectedText + ")" + value.substring(end);
      selectStart = start + 1;
      selectEnd = start + 5; // Select "link"
    } else if (selectedText) {
      // Use selected text as link text
      newText = value.substring(0, start) + "[" + selectedText + "](url)" + value.substring(end);
      selectStart = start + selectedText.length + 3;
      selectEnd = selectStart + 3; // Select "url"
    } else {
      // Insert empty link
      newText = value.substring(0, start) + "[link](url)" + value.substring(end);
      selectStart = start + 1;
      selectEnd = start + 5; // Select "link"
    }

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectStart, selectEnd);
    }, 0);
  };

  const buttons = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertMarkdown("**", "**", "bold text"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertMarkdown("*", "*", "italic text"),
    },
    {
      icon: Link,
      label: "Link",
      action: insertLink,
    },
    {
      icon: List,
      label: "List",
      action: () => insertMarkdown("\n- ", "", "item"),
    },
  ];

  return (
    <div className={cn("flex gap-1", className)}>
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={button.action}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          title={button.label}
        >
          <button.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
