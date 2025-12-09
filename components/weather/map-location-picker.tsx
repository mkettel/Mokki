"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { Resort } from "@/types/database";
import { MapPin, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

interface MapLocationPickerProps {
  latitude?: number;
  longitude?: number;
  existingResorts?: Resort[];
  onLocationSelect: (lat: number, lng: number) => void;
  currentResortId?: string;
}

export function MapLocationPicker({
  latitude,
  longitude,
  existingResorts = [],
  onLocationSelect,
  currentResortId,
}: MapLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const { resolvedTheme } = useTheme();

  const mapStyle =
    resolvedTheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/outdoors-v12";

  const updateSelectedMarker = useCallback(
    (lat: number, lng: number) => {
      if (!map.current) return;

      if (marker.current) {
        marker.current.remove();
      }

      const el = document.createElement("div");
      el.className = "selected-location-marker";
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="hsl(var(--primary))" stroke="white" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;

      marker.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .addTo(map.current);

      map.current.flyTo({ center: [lng, lat], zoom: 12 });
    },
    []
  );

  const addExistingResortMarkers = useCallback(() => {
    if (!map.current) return;

    existingResorts
      .filter((r) => r.id !== currentResortId)
      .forEach((resort) => {
        const el = document.createElement("div");
        el.className = "existing-resort-marker";
        el.title = resort.name;
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="hsl(var(--muted-foreground))" stroke="white" stroke-width="1.5"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;

        new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([resort.longitude, resort.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<strong>${resort.name}</strong>`
            )
          )
          .addTo(map.current!);
      });
  }, [existingResorts, currentResortId]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!token) {
      setMapError(
        "Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment."
      );
      return;
    }

    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    try {
      const initialCenter: [number, number] = [
        longitude ?? -120.0,
        latitude ?? 39.0,
      ];
      const initialZoom = latitude && longitude ? 10 : 5;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: initialCenter,
        zoom: initialZoom,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      const geocoder = new MapboxGeocoder({
        accessToken: token,
        mapboxgl: mapboxgl as never,
        marker: false,
        placeholder: "Search for a location...",
        proximity: { longitude: -120, latitude: 39 },
      });

      map.current.addControl(geocoder, "top-left");

      geocoder.on("result", (e: { result: { center: [number, number] } }) => {
        const [lng, lat] = e.result.center;
        updateSelectedMarker(lat, lng);
        onLocationSelect(lat, lng);
      });

      map.current.on("click", (e: mapboxgl.MapMouseEvent) => {
        updateSelectedMarker(e.lngLat.lat, e.lngLat.lng);
        onLocationSelect(e.lngLat.lat, e.lngLat.lng);
      });

      map.current.on("load", () => {
        setIsMapLoaded(true);
        addExistingResortMarkers();

        if (latitude && longitude) {
          updateSelectedMarker(latitude, longitude);
        }
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map. Please try again.");
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle map resize when dialog opens (after animation)
  useEffect(() => {
    if (isMapLoaded && map.current) {
      const timer = setTimeout(() => {
        map.current?.resize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isMapLoaded]);

  // Update marker when lat/lng props change externally
  useEffect(() => {
    if (isMapLoaded && latitude && longitude && map.current) {
      const currentMarkerLngLat = marker.current?.getLngLat();
      if (
        !currentMarkerLngLat ||
        Math.abs(currentMarkerLngLat.lat - latitude) > 0.0001 ||
        Math.abs(currentMarkerLngLat.lng - longitude) > 0.0001
      ) {
        updateSelectedMarker(latitude, longitude);
      }
    }
  }, [latitude, longitude, isMapLoaded, updateSelectedMarker]);

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-[250px] sm:h-[400px] bg-muted rounded-lg border">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Search or click on the map to set location</span>
      </div>
      <div
        ref={mapContainer}
        className="h-[250px] sm:h-[400px] rounded-lg border overflow-hidden"
      />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-primary" />
          <span>Selected location</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-muted-foreground" />
          <span>Existing resorts</span>
        </div>
      </div>
    </div>
  );
}
