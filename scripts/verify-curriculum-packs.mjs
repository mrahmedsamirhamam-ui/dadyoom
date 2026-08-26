
import fs from "node:fs";
import path from "node:path";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

const dir = path.resolve(process.cwd(), "data/curriculum-packs");
const files = fs.readdirSync(dir).filter((name) => name.endsWith(".json") && name !== "arab-countries.json");
if (!files.length) throw new Error("No curriculum pack files found.");
let lessons = 0;
for (const name of files) {
  const pack = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
  const result = validateCurriculumPack(pack);
  if (!result.ok) { console.error(`INVALID=${name}`); console.error(result.errors.join("\n")); process.exitCode = 1; }
  else { const count = pack.units.flatMap((u) => u.lessons).length; lessons += count; console.log(`VALID=${name} LESSONS=${count}`); }
}
if (process.exitCode) process.exit(process.exitCode);
console.log(`PACK_FILES=${files.length}`);
console.log(`TOTAL_PACK_LESSONS=${lessons}`);
console.log("CURRICULUM_PACKS_VERIFY=PASS");
