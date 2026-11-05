import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      "server-only": path.resolve(
        import.meta.dirname,
        "tests/mocks/server-only.ts"
      ),
    },
  },

  test: {
    environment: "node",
    // These use node:test; running them inside Vitest executes assertions but
    // misreports "No test suite found". Run them explicitly with node --test.
    exclude: [...configDefaults.exclude, "**/*.node.test.mjs"],
  },
});