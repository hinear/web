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
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192-transparent.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192-transparent.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512-transparent.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-transparent.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png",
        sizes: "1290x2796",
        type: "image/png",
        label: "Hinear on iPhone 16",
      },
      {
        src: "/splash_screens/iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait.png",
        sizes: "1320x2868",
        type: "image/png",
        label: "Hinear on iPhone 17 Pro Max",
      },
      {
        src: "/splash_screens/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_portrait.png",
        sizes: "1290x2796",
        type: "image/png",
        label: "Hinear on iPhone 17 Pro",
      },
      {
        src: "/splash_screens/13__iPad_Pro_M4_portrait.png",
        sizes: "2048x2732",
        type: "image/png",
        label: 'Hinear on iPad Pro 13"',
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
