import { MediaType } from "@/types/database";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export function getMediaType(mimeType: string): MediaType | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return "video";
  return null;
}

export function validateMediaFile(file: File): {
  valid: boolean;
  error?: string;
  mediaType?: MediaType;
} {
  const mediaType = getMediaType(file.type);

  if (!mediaType) {
    return {
      valid: false,
      error: "Please upload a supported image (JPEG, PNG, WebP, GIF, HEIC) or video (MP4, MOV, WebM)",
    };
  }

  const maxSize = mediaType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  const sizeLabel = mediaType === "image" ? "10MB" : "100MB";

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `${mediaType === "image" ? "Image" : "Video"} must be smaller than ${sizeLabel}`,
    };
  }

  return { valid: true, mediaType };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function getVideoDimensions(
  file: File
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Math.round(video.duration),
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video"));
    };

    video.src = URL.createObjectURL(file);
  });
}

export async function generateVideoThumbnail(
  file: File,
  seekTime: number = 0.5
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(seekTime, video.duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(video.src);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(video.src);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create thumbnail"));
          }
        },
        "image/jpeg",
        0.8
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video for thumbnail"));
    };

    video.src = URL.createObjectURL(file);
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function isVideoFile(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
}

export function isImageFile(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}
