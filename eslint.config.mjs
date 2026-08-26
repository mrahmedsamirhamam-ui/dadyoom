
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const releaseIgnores = [
  ".next/**",
  "node_modules/**",
  "_backups/**",
  "**/_backups/**",
  ".dadyoom-backups/**",
  "**/*.bak",
  "**/*.bak-*",
  "**/*.before-*",
  "**/*.backup",
  "**/*.old",
  "supabase/.temp/**",
  "out/**",
  "build/**",
  "coverage/**",
  "next-env.d.ts",
  "app/(dashboard)/types/**",
  "importer/output/**",
  "data/**/*.js",
];

const eslintConfig = defineConfig([
  { ignores: releaseIgnores },
  ...nextVitals,
  ...nextTs,
  globalIgnores(releaseIgnores),
]);

export default eslintConfig;
