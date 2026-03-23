import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hinear",
    short_name: "Hinear",
    description:
      "Project-first issue tracking for personal and team workflows.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3efe7",
    theme_color: "#f3efe7",
    icons: [
      {
        src: "/icon-192-transparent.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512-transparent.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
