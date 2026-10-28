#!/usr/bin/env node
/**
 * Cloudflare Workers build from committed Vite/cf source config.
 *
 * The existing Node/Render build stays on React 19.2.4 + Next standalone.
 * vinext 1.3 requires React 19.3.1; install that combo only inside this
 * ephemeral Cloudflare build checkout and restore package.json afterward.
 * Never writes credentials, pushes code, updates package-lock, or deploys.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

// cf@1.0.0-beta.21 rejects older Node minor versions. Fail before changing
// package.json or installing alternate React/vinext dependencies, so the
// Cloudflare Builds log exposes a precise actionable error.
const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
const minMinorByMajor = { 22: 23, 24: 22, 26: 12 };
if (!(nodeMajor in minMinorByMajor) ||
    nodeMinor < minMinorByMajor[nodeMajor]) {
  throw new Error(
    "CLOUDFLARE_UNSUPPORTED_NODE_RUNTIME: cf@1.0.0-beta.21 requires " +
    "Node ^22.23.0 || ^24.22.0 || ^26.12.0; detected " +
    process.versions.node + ". Set Cloudflare Builds Node version to a compatible release."
  );
}
console.log("CLOUDFLARE_NODE_ENGINE_CHECK=PASS " + process.versions.node);

for (const file of ["vite.config.ts", "cloudflare.config.ts", "next.config.ts"]) {
  if (!existsSync(file)) {
    throw new Error("CLOUDFLARE_REQUIRED_SOURCE_CONFIG_MISSING: " + file);
  }
}
const original = readFileSync("package.json", "utf8");
const pkg = JSON.parse(original);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const command = (bin, args) => {
  console.log("CLOUDFLARE_BUILD_STEP=" + bin + " " + args.join(" "));
  execFileSync(bin, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      DADYOOM_WORKER_BUILD: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
};

try {
  pkg.dependencies.react = "19.3.1";
  pkg.dependencies["react-dom"] = "19.3.1";
  pkg.dependencies["react-server-dom-webpack"] = "19.3.1";
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

  const installFlags = [
    "install", "--no-save", "--package-lock=false", "--no-audit", "--no-fund",
  ];
  command(npm, [...installFlags, "vinext@1.3.0"]);
  command(npm, [
    ...installFlags,
    "vinext@1.3.0",
    "@vinext/cloudflare@1.2.0",
    "vite@8.3.0",
    "@vitejs/plugin-react@6.1.2",
    "@vitejs/plugin-rsc@0.5.38",
    "@cloudflare/vite-plugin@beta",
    "cf@1.0.0-beta.21",
    "@babel/plugin-transform-runtime@7.29.0",
    "react-server-dom-webpack@19.3.1",
  ]);
  // Explicit Vite config is ESM, compatible with the Cloudflare Vite plugin.
  // vinext documents vite build as the successor to the legacy vinext build.
  command(npx, ["vinext", "build"]);
  if (!existsSync(".cloudflare/output/v0/config.json") ||
      !existsSync(".cloudflare/output/v0/workers/default/bundle/ssr/index.js")) {
    throw new Error("CLOUDFLARE_BUILD_OUTPUT_NOT_GENERATED");
  }
  console.log("DADYOOM_COMMITTED_CLOUDFLARE_BUILD=PASS");
} finally {
  // Preserve the immutable production Next/React dependency manifest.
  // node_modules is a disposable build artifact, not a user-data directory.
  writeFileSync("package.json", original);
}
