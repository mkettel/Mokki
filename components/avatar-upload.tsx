"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import { uploadAvatar, removeAvatar } from "@/lib/actions/avatar";
import { validateImageFile, resizeImage } from "@/lib/utils/image";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  displayName: string | null;
  email: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  email,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (displayName?.[0] || email[0]).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Resize and upload
    setIsUploading(true);
    try {
      const resized = await resizeImage(file, 400, 400);
      const formData = new FormData();
      formData.append("avatar", resized, "avatar.jpg");

      const result = await uploadAvatar(formData);
      if (result.error) {
        setError(result.error);
        setPreview(null);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image");
      setPreview(null);
    } finally {
      setIsUploading(false);
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    setError(null);

    const result = await removeAvatar();
    if (result.error) {
      setError(result.error);
    } else {
      setPreview(null);
    }

    setIsUploading(false);
  };

  const displayUrl = preview || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-44 w-44">
          <AvatarImage
            src={displayUrl || undefined}
            alt={displayName || "Avatar"}
          />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {currentAvatarUrl ? "Change Photo" : "Add Photo"}
        </Button>

        {(currentAvatarUrl || preview) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
