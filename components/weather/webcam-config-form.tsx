"use client";

import { useState } from "react";
import { WebcamConfig } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Plus, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebcamConfigFormProps {
  webcams: WebcamConfig[];
  onChange: (webcams: WebcamConfig[]) => void;
}

function isValidWebcamUrl(url: string): { valid: boolean; error?: string } {
  if (!url.trim()) {
    return { valid: false, error: "URL is required" };
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "URL must use HTTPS" };
    }
    if (["javascript:", "data:", "vbscript:"].includes(parsed.protocol)) {
      return { valid: false, error: "Invalid URL protocol" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

export function WebcamConfigForm({ webcams, onChange }: WebcamConfigFormProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const addWebcam = () => {
    onChange([...webcams, { name: "", url: "", type: "image" }]);
  };

  const updateWebcam = (index: number, updates: Partial<WebcamConfig>) => {
    const updated = webcams.map((w, i) =>
      i === index ? { ...w, ...updates } : w
    );
    onChange(updated);
  };

  const removeWebcam = (index: number) => {
    onChange(webcams.filter((_, i) => i !== index));
    if (previewIndex === index) {
      setPreviewIndex(null);
    }
  };

  const togglePreview = (index: number) => {
    setPreviewIndex(previewIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Webcams
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addWebcam}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Webcam
        </Button>
      </div>

      {webcams.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
          No webcams configured. Click "Add Webcam" to add one.
        </p>
      ) : (
        <div className="space-y-4">
          {webcams.map((webcam, index) => {
            const urlValidation = webcam.url
              ? isValidWebcamUrl(webcam.url)
              : { valid: true };
            const showPreview = previewIndex === index && urlValidation.valid;

            return (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Webcam {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    {webcam.url && urlValidation.valid && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePreview(index)}
                        className="h-8 w-8"
                        title={showPreview ? "Hide preview" : "Show preview"}
                      >
                        {showPreview ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWebcam(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`webcam-name-${index}`} className="text-xs">
                    Name
                  </Label>
                  <Input
                    id={`webcam-name-${index}`}
                    value={webcam.name}
                    onChange={(e) =>
                      updateWebcam(index, { name: e.target.value })
                    }
                    placeholder="e.g., Base Lodge, Summit"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`webcam-url-${index}`} className="text-xs">
                    URL
                  </Label>
                  <Input
                    id={`webcam-url-${index}`}
                    value={webcam.url}
                    onChange={(e) =>
                      updateWebcam(index, { url: e.target.value })
                    }
                    placeholder="https://..."
                    className={cn(
                      "h-9",
                      webcam.url &&
                        !urlValidation.valid &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {webcam.url && !urlValidation.valid && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {urlValidation.error}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`webcam-type-${index}`} className="text-xs">
                    Type
                  </Label>
                  <Select
                    value={webcam.type}
                    onValueChange={(value: "image" | "embed") =>
                      updateWebcam(index, { type: value })
                    }
                  >
                    <SelectTrigger id={`webcam-type-${index}`} className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">
                        Image (direct URL to .jpg/.png)
                      </SelectItem>
                      <SelectItem value="embed">
                        Embed (iframe/webpage)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showPreview && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Preview:
                    </p>
                    <div className="rounded-md overflow-hidden bg-accent">
                      {webcam.type === "image" ? (
                        <img
                          src={webcam.url}
                          alt={webcam.name || "Webcam preview"}
                          className="w-full h-auto max-h-48 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "";
                            e.currentTarget.alt = "Failed to load image";
                          }}
                        />
                      ) : (
                        <div className="aspect-video">
                          <iframe
                            src={webcam.url}
                            className="w-full h-full"
                            title={webcam.name || "Webcam preview"}
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
