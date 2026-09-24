import fs from "node:fs";
import path from "node:path";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

const dir = path.resolve(process.cwd(), "data/curriculum-packs");
const registryFiles = new Set([
  "arab-countries.json",
  "official-sources-2026.json",
]);

const files = [];

function collect(currentDir, prefix = "") {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      collect(absolute, relative);
      continue;
    }

    if (
      entry.name.endsWith(".json") &&
      !registryFiles.has(entry.name)
    ) {
      files.push(relative);
    }
  }
}

collect(dir);
files.sort();

if (!files.length) {
  throw new Error("No curriculum pack files found.");
}

let lessons = 0;

for (const name of files) {
  const pack = JSON.parse(
    fs.readFileSync(path.join(dir, name), "utf8")
  );
  const result = validateCurriculumPack(pack);

  if (!result.ok) {
    console.error(`INVALID=${name}`);
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
    continue;
  }

  const count =
    pack.units.flatMap((unit) => unit.lessons).length;

  lessons += count;
  console.log(`VALID=${name} LESSONS=${count}`);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(`PACK_FILES=${files.length}`);
console.log(`TOTAL_PACK_LESSONS=${lessons}`);
console.log("CURRICULUM_PACKS_VERIFY=PASS");
