import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "_backups/**",
      "**/_backups/**",
      "app/(dashboard)/types/**",
      "importer/output/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "node_modules/**",
      "_backups/**",
      "**/_backups/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "app/(dashboard)/types/**",
    "importer/output/**",
  ]),
]);

export default eslintConfig;