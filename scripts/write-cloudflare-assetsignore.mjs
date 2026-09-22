import fs from "node:fs";
import path from "node:path";

const MAX_BYTES = 25 * 1024 * 1024;
const ALWAYS = ["**/*.apk"];

function rel(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function oversized(root) {
  const rows = [];
  if (!fs.existsSync(root)) return rows;

  const stack = [root];

  while (stack.length) {
    const dir = stack.pop();
    let entries = [];

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }

      if (!entry.isFile() || entry.name === ".assetsignore") {
        continue;
      }

      try {
        const stat = fs.statSync(full);

        if (stat.size > MAX_BYTES) {
          rows.push({
            relative: rel(root, full),
            bytes: stat.size,
            mib: Number(
              (stat.size / 1024 / 1024).toFixed(2),
            ),
          });
        }
      } catch {}
    }
  }

  return rows.sort((a, b) => b.bytes - a.bytes);
}

for (const root of [
  path.resolve("public"),
  path.resolve("dist/client"),
]) {
  if (!fs.existsSync(root)) continue;

  const rows = oversized(root);
  const ignorePath = path.join(root, ".assetsignore");

  const lines = (
    fs.existsSync(ignorePath)
      ? fs.readFileSync(ignorePath, "utf8")
      : ""
  )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const pattern of ALWAYS) {
    if (!lines.includes(pattern)) lines.push(pattern);
  }

  for (const item of rows) {
    if (!lines.includes(item.relative)) {
      lines.push(item.relative);
    }
  }

  fs.writeFileSync(
    ignorePath,
    [...new Set(lines)].join("\n") + "\n",
    "utf8",
  );

  console.log(`ASSET_ROOT=${root}`);
  console.log(`OVERSIZED_ASSETS=${rows.length}`);

  for (const item of rows) {
    console.log(
      `IGNORED_OVERSIZED | ${item.mib} MiB | ${item.relative}`,
    );
  }
}

console.log("CLOUDFLARE_ASSET_IGNORE_GATE=PASS");
