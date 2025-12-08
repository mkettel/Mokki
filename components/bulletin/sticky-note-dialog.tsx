"use client";

import { useState, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createBulletinItem, updateBulletinItem } from "@/lib/actions/bulletin";
import { BulletinItemWithProfile, BulletinCategory } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MarkdownToolbar } from "./markdown-toolbar";

const categories: { value: BulletinCategory | "none"; label: string }[] = [
  { value: "none", label: "No Category" },
  { value: "wifi", label: "WiFi Info" },
  { value: "house_rules", label: "House Rules" },
  { value: "emergency", label: "Emergency Contact" },
  { value: "local_tips", label: "Local Tips" },
];

const colors = [
  { value: "blue", label: "Blue", class: "bg-[#C1AAC0]" },
  { value: "beige", label: "Beige", class: "bg-[#F6F5DF]" },
  { value: "granite", label: "Granite", class: "bg-[#3B5249]" },
  { value: "brown", label: "Brown", class: "bg-[#895737]" },
  { value: "red", label: "Red", class: "bg-[#53131E]" },
];

interface StickyNoteDialogProps {
  houseId: string;
  editItem?: BulletinItemWithProfile;
  trigger?: ReactNode;
}

export function StickyNoteDialog({
  houseId,
  editItem,
  trigger,
}: StickyNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<BulletinCategory | "none">(
    editItem?.category || "none"
  );
  const [title, setTitle] = useState(editItem?.title || "");
  const [content, setContent] = useState(editItem?.content || "");
  const [color, setColor] = useState(editItem?.color || "beige");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditing = !!editItem;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("house_id", houseId);
      formData.append("category", category === "none" ? "" : category);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("color", color);

      const result = isEditing
        ? await updateBulletinItem(editItem.id, formData)
        : await createBulletinItem(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!isEditing) {
        setTitle("");
        setContent("");
        setCategory("none");
        setColor("beige");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Failed to save note. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && editItem) {
      setCategory(editItem.category || "none");
      setTitle(editItem.title);
      setContent(editItem.content);
      setColor(editItem.color);
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Note
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Note" : "Add New Note"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this sticky note"
              : "Create a new sticky note for the bulletin board"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Category Select */}
          <div className="grid gap-2">
            <Label>Category (optional)</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-start">
                  {categories.find((c) => c.value === category)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={category === cat.value ? "bg-accent" : ""}
                  >
                    {cat.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="WiFi Password, Emergency Number..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <MarkdownToolbar
                textareaRef={textareaRef}
                value={content}
                onChange={setContent}
              />
            </div>
            <textarea
              ref={textareaRef}
              id="content"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter the details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
            />
          </div>

          {/* Color Picker */}
          <div className="grid gap-2">
            <Label>Note Color</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    c.class,
                    color === c.value &&
                      "ring-2 ring-offset-2 ring-primary scale-110"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Add Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
