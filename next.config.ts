import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workers use Vite's server bundle, not Next standalone output.
  // Keep standalone unchanged for the existing Node/Render deployment.
  output: process.env.DADYOOM_WORKER_BUILD === "1" ? undefined : "standalone",
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






