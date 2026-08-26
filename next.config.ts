import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/api/dad-voice": [
      "./next.config.ts",
      "./proxy.ts",
      "./middleware.ts.before-proxy-migration",
      "./app/api/dad-voice/*.before-*",
    ],
  },
};

export default nextConfig;
