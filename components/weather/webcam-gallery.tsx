"use client";

import { useState, useEffect, useMemo } from "react";
import { WebcamConfig } from "@/types/database";
import { Camera, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// Validate webcam URLs to prevent XSS
function isValidWebcamUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow https URLs
    if (parsed.protocol !== "https:") return false;
    // Block dangerous protocols
    if (["javascript:", "data:", "vbscript:"].includes(parsed.protocol))
      return false;
    return true;
  } catch {
    return false;
  }
}

interface WebcamGalleryProps {
  webcams: WebcamConfig[];
  resortName: string;
  websiteUrl?: string | null;
}

export function WebcamGallery({
  webcams,
  resortName,
  websiteUrl,
}: WebcamGalleryProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Filter out invalid webcam URLs
  const validWebcams = useMemo(
    () => webcams.filter((w) => isValidWebcamUrl(w.url)),
    [webcams]
  );

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
      setLastRefresh(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setLastRefresh(new Date());
  };

  if (validWebcams.length === 0) {
    return (
      <div className="p-6">
        <div className="pb-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Camera className="h-5 w-5" />
            Webcams
          </div>
        </div>
        <div className="text-center py-6">
          <p className="text-muted-foreground mb-4">
            No webcams configured for {resortName}
          </p>
          {websiteUrl && (
            <Button variant="outline" asChild>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                View on resort website
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Camera className="h-5 w-5" />
            Webcams
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
            <Button variant="ghost" size="sm" onClick={handleManualRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div>
        <div className="grid gap-4 md:grid-cols-2">
          {validWebcams.map((webcam, index) => (
            <div
              key={`${webcam.url}-${refreshKey}-${index}`}
              className="space-y-2"
            >
              <p className="text-sm font-medium">
                {webcam.name || `Webcam ${index + 1}`}
              </p>
              {webcam.type === "image" ? (
                <img
                  src={`${webcam.url}?t=${refreshKey}`}
                  alt={webcam.name || `${resortName} webcam`}
                  className="w-full rounded-md bg-accent"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-square">
                  <iframe
                    src={webcam.url}
                    className="w-full h-full rounded-md"
                    title={webcam.name || `${resortName} webcam`}
                    allow="autoplay"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {websiteUrl && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" asChild>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                More webcams on {resortName}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
