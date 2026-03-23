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
        src: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
