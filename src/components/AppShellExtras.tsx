"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(
  () =>
    import("sonner").then((module) => ({
      default: module.Toaster,
    })),
  { ssr: false }
);

const ServiceWorkerRegister = dynamic(
  () =>
    import("@/components/organisms/ServiceWorkerRegister").then((module) => ({
      default: module.ServiceWorkerRegister,
    })),
  { ssr: false }
);

const WebVitals = dynamic(
  () =>
    import("@/components/WebVitals").then((module) => ({
      default: module.WebVitals,
    })),
  { ssr: false }
);

export function AppShellExtras() {
  return (
    <>
      <ServiceWorkerRegister />
      <WebVitals />
      <Toaster />
    </>
  );
}
