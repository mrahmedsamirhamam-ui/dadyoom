import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
    webpackBuildWorker: false,
    serverSourceMaps: false,
  },
  productionBrowserSourceMaps: false,
  enablePrerenderSourceMaps: false,
  outputFileTracingExcludes: {
    "/*": [
      "./.env*",
      "./.git/**",
      "./_backups/**",
      "./diagnostics/**",
      "./.dadyoom-*/**",
      "./**/*.before-*",
      "./**/*.bak*",
    ],
    "/api/dad-voice": [
      "./next.config.ts",
      "./proxy.ts",
      "./middleware.ts.before-proxy-migration",
      "./app/api/dad-voice/*.before-*",
    ],
  },
};

export default nextConfig;






