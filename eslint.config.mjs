
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const releaseIgnores = [
  "diagnostics/release-backups/**",
  ".dadyoom-runtime/**",
  "android/**",
  "ios/**",
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
  "scripts/curriculum-v14/revalidate-downloaded-books-v10.mjs",
  "scripts/curriculum-v14/classify-extract-content-v4.mjs",
  "check_tn.js",
  "analyze_archive.js",
  "_curriculum-forensic-baseline-*/**",
  "PROJECT/**",
  ".dadyoom-deploy/**",
];

const eslintConfig = defineConfig([
  { ignores: releaseIgnores },
  ...nextVitals,
  ...nextTs,
  globalIgnores(releaseIgnores),
]);

export default eslintConfig;
