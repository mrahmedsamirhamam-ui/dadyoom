import path from "node:path";
import { tmpdir } from "node:os";
import { defineConfig, mergeConfig } from "vitest/config";
import base from "../../vitest.config.mts";

export default mergeConfig(base, defineConfig({
  envDir: false,
  cacheDir: path.join(tmpdir(), "dadyoom-security-vitest"),
  resolve: {
    alias: {
      "server-only": path.resolve(import.meta.dirname, "../../node_modules/next/dist/compiled/server-only/empty.js"),
    },
  },
  test: {
    include: ["tests/security/*.test.ts"],
    setupFiles: ["tests/security/setup.ts"],
  },
}));



