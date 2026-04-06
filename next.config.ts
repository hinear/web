import withBundleAnalyzer from "@next/bundle-analyzer";
import withSerwist from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "lucide-react"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        maxAssetSize: 200000, // 200KB
        maxEntrypointSize: 200000,
      };
    }
    return config;
  },
};

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzerConfig(
  withSerwist({
    swSrc: "src/worker/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development",
  })(nextConfig)
);
