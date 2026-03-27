import type { Metadata, Viewport } from "next";
import { PWA_PRIMARY_COLOR, PWA_STARTUP_IMAGES } from "@/app/pwa-metadata";
import { AppShellExtras } from "@/components/AppShellExtras";
import "./globals.css";

function getMetadataBase() {
  const origin =
    process.env.APP_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";

  return new URL(origin);
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Hinear",
    template: "%s | Hinear",
  },
  description: "Project-first issue tracking for personal and team workflows.",
  applicationName: "Hinear",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Hinear",
    title: "Hinear",
    description:
      "Project-first issue tracking for personal and team workflows.",
    images: [
      {
        url: "/og-image.png",
        alt: "Hinear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hinear",
    description:
      "Project-first issue tracking for personal and team workflows.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      {
        url: "/api/pwa/icon?size=512",
        type: "image/png",
        sizes: "512x512",
      },
      {
        url: "/api/pwa/icon?size=192",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: [
      {
        url: "/api/pwa/icon?size=180",
        type: "image/png",
        sizes: "180x180",
      },
    ],
    shortcut: ["/api/pwa/icon?size=192"],
  },
  appleWebApp: {
    capable: true,
    startupImage: PWA_STARTUP_IMAGES,
    statusBarStyle: "black-translucent",
    title: "Hinear",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: PWA_PRIMARY_COLOR,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppShellExtras />
        {children}
      </body>
    </html>
  );
}
