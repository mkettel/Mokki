"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Upload, X, Loader2, ImageIcon, Film } from "lucide-react";
import { saveBRollMetadata } from "@/lib/actions/broll";
import { createClient } from "@/lib/supabase/client";
import {
  validateMediaFile,
  formatFileSize,
  getImageDimensions,
  getVideoDimensions,
} from "@/lib/utils/media";
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
import { cn } from "@/lib/utils";
import { MediaType, Profile } from "@/types/database";
import { useBRollContext } from "./broll-context";

const MAX_FILES_PER_UPLOAD = 20;

interface FileWithPreview {
  file: File;
  preview: string;
  caption: string;
  mediaType: MediaType;
  width?: number;
  height?: number;
  duration?: number;
  error?: string;
}

interface BRollUploadDialogProps {
  houseId: string;
  currentUserProfile: Profile;
}

export function BRollUploadDialog({ houseId, currentUserProfile }: BRollUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItems } = useBRollContext();

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = [];
    const filesToProcess = Array.from(fileList);

    // Check if adding these files would exceed the limit
    const remainingSlots = MAX_FILES_PER_UPLOAD - files.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_FILES_PER_UPLOAD} files per upload`);
      return;
    }

    const filesToAdd = filesToProcess.slice(0, remainingSlots);
    if (filesToAdd.length < filesToProcess.length) {
      setError(`Only added ${filesToAdd.length} files (max ${MAX_FILES_PER_UPLOAD} total)`);
    }

    for (const file of filesToAdd) {
      const validation = validateMediaFile(file);

      if (!validation.valid || !validation.mediaType) {
        newFiles.push({
          file,
          preview: "",
          caption: "",
          mediaType: "image",
          error: validation.error,
        });
        continue;
      }

      const preview = URL.createObjectURL(file);
      let dimensions: { width: number; height: number; duration?: number } | null = null;

      try {
        if (validation.mediaType === "video") {
          dimensions = await getVideoDimensions(file);
        } else {
          dimensions = await getImageDimensions(file);
        }
      } catch (e) {
        console.error("Failed to get dimensions:", e);
      }

      newFiles.push({
        file,
        preview,
        caption: "",
        mediaType: validation.mediaType,
        width: dimensions?.width,
        height: dimensions?.height,
        duration: dimensions?.duration,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, [files.length]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateCaption = useCallback((index: number, caption: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption } : f))
    );
  }, []);

  const handleUpload = async () => {
    const validFiles = files.filter((f) => !f.error);
    if (validFiles.length === 0) {
      setError("No valid files to upload");
      return;
    }

    setIsUploading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setIsUploading(false);
      return;
    }

    const baseTimestamp = Date.now();
    const uploadErrors: string[] = [];

    // Upload files directly to Supabase Storage from the client
    const uploadResults = await Promise.allSettled(
      validFiles.map(async (f, index) => {
        const sanitizedFileName = f.file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `${houseId}/${user.id}/${baseTimestamp}_${index}_${sanitizedFileName}`;

        // Upload directly to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("broll")
          .upload(storagePath, f.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`${f.file.name}: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("broll").getPublicUrl(storagePath);

        // Save metadata via server action
        const { item, error: metadataError } = await saveBRollMetadata({
          houseId,
          storagePath,
          publicUrl,
          mediaType: f.mediaType,
          fileName: f.file.name,
          fileSize: f.file.size,
          mimeType: f.file.type,
          caption: f.caption || null,
          width: f.width || null,
          height: f.height || null,
          duration: f.duration || null,
        });

        if (metadataError || !item) {
          // Clean up uploaded file if metadata save fails
          await supabase.storage.from("broll").remove([storagePath]);
          throw new Error(`${f.file.name}: ${metadataError || "Failed to save"}`);
        }

        return item;
      })
    );

    // Collect results and errors
    const successfulItems = [];
    for (const result of uploadResults) {
      if (result.status === "fulfilled") {
        successfulItems.push(result.value);
      } else {
        uploadErrors.push(result.reason?.message || "Unknown upload error");
      }
    }

    // Add uploaded items to the feed
    if (successfulItems.length > 0) {
      addItems(successfulItems, currentUserProfile);
    }

    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });

    if (uploadErrors.length > 0 && successfulItems.length === 0) {
      setError(uploadErrors.join("; "));
      setIsUploading(false);
      return;
    }

    setFiles([]);
    setOpen(false);
    setIsUploading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);
      setError(null);
    }
  };

  const validFilesCount = files.filter((f) => !f.error).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload photos and videos to share with your house
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,video/mp4,video/quicktime,video/webm"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Images up to 10MB, videos up to 100MB
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <Label>Selected Files ({files.length})</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {files.map((f, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      f.error ? "border-destructive/50 bg-destructive/5" : ""
                    )}
                  >
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                      {f.error ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <X className="h-6 w-6 text-destructive" />
                        </div>
                      ) : f.mediaType === "video" ? (
                        <video
                          src={f.preview}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={f.preview}
                          alt={f.file.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {f.mediaType === "video" ? (
                          <Film className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium truncate">
                          {f.file.name}
                        </p>
                      </div>

                      {f.error ? (
                        <p className="text-xs text-destructive mt-1">{f.error}</p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(f.file.size)}
                            {f.width && f.height && ` • ${f.width}x${f.height}`}
                          </p>
                          <Input
                            placeholder="Add a caption (optional)"
                            value={f.caption}
                            onChange={(e) => updateCaption(index, e.target.value)}
                            className="mt-2 h-8 text-sm"
                          />
                        </>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || validFilesCount === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${validFilesCount > 0 ? `(${validFilesCount})` : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
