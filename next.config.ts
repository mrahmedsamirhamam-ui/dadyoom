import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
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






