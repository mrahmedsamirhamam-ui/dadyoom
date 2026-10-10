// Fail the build before deployment if vinext has no usable browser assets.
// Read-only integrity check; never accesses production or private credentials.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve("dist/client");
const chunksDir = join(root, "_next", "static", "chunks");

if (!existsSync(chunksDir)) {
  console.error("DADYOOM_CLIENT_CHUNKS=FAIL_DIRECTORY_MISSING", chunksDir);
  process.exit(1);
}

const jsFiles = [];
const stack = [chunksDir];
while (stack.length) {
  const folder = stack.pop();
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (entry.isDirectory()) stack.push(file);
    else if (entry.isFile() && entry.name.endsWith(".js")) {
      const bytes = statSync(file).size;
      jsFiles.push({ relative: relative(root, file).replaceAll("\\", "/"), bytes });
    }
  }
}

const ignored = existsSync(join(root, ".assetsignore"))
  ? readFileSync(join(root, ".assetsignore"), "utf8")
    .split(/\r?\n/u).map((x) => x.trim()).filter(Boolean)
  : [];

const conflictingPatterns = ignored.filter((line) =>
  line === "*" || line === "**/*" ||
  line === "*.js" || line === "**/*.js" ||
  line === "_next" || line === "_next/**" ||
  line === "_next/static/**" || line === "_next/static/chunks/**"
);

const oversizedJs = jsFiles.filter((f) => f.bytes > 25 * 1024 * 1024);
const emptyJs = jsFiles.filter((f) => f.bytes === 0);

console.log("DADYOOM_BROWSER_BUNDLE_DIAGNOSTICS", JSON.stringify({
  chunkDirectory: "_next/static/chunks",
  jsChunks: jsFiles.length,
  totalBytes: jsFiles.reduce((sum, item) => sum + item.bytes, 0),
  sampleFiles: jsFiles.slice(0, 6).map((f) => f.relative),
  conflictingIgnorePatterns: conflictingPatterns,
  oversizedJs: oversizedJs.map((f) => f.relative),
  emptyJs: emptyJs.map((f) => f.relative),
}));

if (jsFiles.length === 0 || conflictingPatterns.length || oversizedJs.length || emptyJs.length) {
  console.error("DADYOOM_BROWSER_BUNDLE_INTEGRITY=FAIL");
  process.exit(1);
}

console.log("DADYOOM_BROWSER_BUNDLE_INTEGRITY=PASS");
