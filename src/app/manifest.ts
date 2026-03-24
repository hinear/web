import type { MetadataRoute } from "next";

const PRIMARY_COLOR = "#5e6ad2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hinear",
    short_name: "Hinear",
    description:
      "Project-first issue tracking for personal and team workflows.",
    start_url: "/",
    display: "standalone",
    background_color: PRIMARY_COLOR,
    theme_color: PRIMARY_COLOR,
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
