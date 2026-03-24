import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/organisms/ServiceWorkerRegister";
import { QueryClientProvider } from "@/lib/react-query/providers";
import "./globals.css";

const PRIMARY_COLOR = "#5e6ad2";

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
        url: "/icon.png",
        type: "image/png",
        sizes: "512x512",
      },
      {
        url: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: [
      {
        url: "/apple-icon-180.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
    shortcut: ["/icon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hinear",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: PRIMARY_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryClientProvider>
          <ServiceWorkerRegister />
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
