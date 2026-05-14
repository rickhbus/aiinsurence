import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI 小健龜智健任務 / AI Turtle Coach Health Quest",
    short_name: "小健龜",
    description:
      "香港 AI 健康任務、照護導航和保險教育 app，使用 AI 小健龜、小步任務和需同意的健康記憶。",
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
