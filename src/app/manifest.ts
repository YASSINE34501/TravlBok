import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TravlBok",
    short_name: "TravlBok",
    description: "Explore, book, and travel — hotels, cars, and flights on TravlBok.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d3150",
    theme_color: "#0d3150",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
