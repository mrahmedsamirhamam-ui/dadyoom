import { existsSync, readFileSync } from "node:fs";

const filename = ".next/prerender-manifest.json";
if (!existsSync(filename)) {
  throw new Error("SITEMAP_BUILD_MANIFEST_MISSING");
}

const manifest = JSON.parse(readFileSync(filename, "utf8"));
const prerendered = Object.keys(manifest.routes ?? {});

if (prerendered.some((route) =>
  route === "/sitemap.xml" ||
  route === "/sitemap.xml/" ||
  route.startsWith("/sitemap.xml/")
)) {
  throw new Error("SITEMAP_INCORRECTLY_STATIC_AT_BUILD_TIME");
}

console.log("SITEMAP_REQUEST_TIME_ROUTE=PASS");
