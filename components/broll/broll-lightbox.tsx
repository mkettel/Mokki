"use client";

import { useState, useEffect, useCallback } from "react";
import { BRollMediaWithProfile } from "@/types/database";
import { deleteBRollMedia, updateBRollCaption } from "@/lib/actions/broll";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X,
  Trash2,
  Pencil,
  Check,
  Download,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { formatFileSize } from "@/lib/utils/media";
import { useBRollContext } from "./broll-context";

interface BRollLightboxProps {
  item: BRollMediaWithProfile;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
}

export function BRollLightbox({
  item,
  isOpen,
  onClose,
  isOwner,
}: BRollLightboxProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(item.caption || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { removeItem, updateItemCaption } = useBRollContext();

  const isVideo = item.media_type === "video";
  const uploaderInitials =
    item.profiles.display_name?.[0]?.toUpperCase() ||
    item.profiles.email[0].toUpperCase();

  useEffect(() => {
    setCaptionValue(item.caption || "");
  }, [item.caption]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isEditingCaption && !showDeleteConfirm) {
        onClose();
      }
    },
    [onClose, isEditingCaption, showDeleteConfirm]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleSaveCaption = async () => {
    setIsSavingCaption(true);
    const result = await updateBRollCaption(item.id, captionValue);
    if (!result.error) {
      updateItemCaption(item.id, captionValue.trim() || null);
      setIsEditingCaption(false);
    }
    setIsSavingCaption(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    const result = await deleteBRollMedia(item.id);
    if (!result.error) {
      removeItem(item.id);
      onClose();
    }
    setIsDeleting(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = item.public_url;
    link.download = item.file_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden"
          showCloseButton={false}
        >
          <div className="relative flex flex-col h-full">
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] max-h-[60vh]">
              {isVideo ? (
                <video
                  src={item.public_url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                  playsInline
                />
              ) : (
                <img
                  src={item.public_url}
                  alt={item.caption || "Photo"}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            <div className="p-4 bg-background">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={item.profiles.avatar_url || undefined}
                    alt={item.profiles.display_name || "User"}
                  />
                  <AvatarFallback>{uploaderInitials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {item.profiles.display_name || item.profiles.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>

                  {isEditingCaption ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={captionValue}
                        onChange={(e) => setCaptionValue(e.target.value)}
                        placeholder="Add a caption..."
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveCaption();
                          if (e.key === "Escape") setIsEditingCaption(false);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveCaption}
                        disabled={isSavingCaption}
                      >
                        {isSavingCaption ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.caption || (
                        <span className="italic">No caption</span>
                      )}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{formatFileSize(item.file_size)}</span>
                    {item.width && item.height && (
                      <span>
                        {item.width} x {item.height}
                      </span>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingCaption(!isEditingCaption)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {isVideo ? "video" : "photo"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              {isVideo ? "video" : "photo"} from your house&apos;s gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
