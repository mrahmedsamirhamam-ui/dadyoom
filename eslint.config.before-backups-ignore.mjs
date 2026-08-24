import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "app/(dashboard)/types/**",
      "importer/output/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "app/(dashboard)/types/**",
    "importer/output/**",
  ]),
]);

export default eslintConfig;