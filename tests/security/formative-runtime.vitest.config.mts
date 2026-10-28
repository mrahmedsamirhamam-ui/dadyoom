import path from "node:path";
import { tmpdir } from "node:os";
import { defineConfig, mergeConfig } from "vitest/config";
import base from "../../vitest.config.mts";

// Unlike read-only DB tests, the real Gemini route deliberately calls fetch.
// The test replaces global fetch with a local vi.fn response; use an isolated
// config instead of the security setup that bans even stubbed fetch calls.
export default mergeConfig(base, defineConfig({
  envDir: false,
  cacheDir: path.join(tmpdir(), "dadyoom-formative-vitest"),
  test: {
    include: ["tests/security/formative-grading-no-persistence.test.ts"],
    setupFiles: [],
  },
}));
