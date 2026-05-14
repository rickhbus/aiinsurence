import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Health Guide / 智健導航",
    short_name: "智健導航",
    description:
      "A bilingual Hong Kong health, fitness, nutrition, AI coaching, healthcare navigation, and insurance education app with consent-based health memory.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6FDA0B",
    orientation: "portrait-primary",
    lang: "zh-Hant-HK",
    categories: ["health", "medical", "fitness", "insurance"],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
