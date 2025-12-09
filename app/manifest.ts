import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mökki - Ski House Manager",
    short_name: "Mökki",
    description:
      "Manage your ski lease house - track stays, split expenses, and coordinate with your group",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#212121",
    theme_color: "#212121",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
