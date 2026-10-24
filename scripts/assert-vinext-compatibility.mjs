import fs from "node:fs";
const path = process.argv[2] || "vinext-check.txt";
const report = fs.readFileSync(path, "utf8").replace(/\u001b\[[0-9;]*m/g, "");
const overall = report.match(/Overall:\s*(\d+)% compatible\s*\((\d+) supported,\s*(\d+) partial,\s*(\d+) issues?\)/i);
if (!overall) {
  console.error("VINEXT_REPORT_UNRECOGNIZED: fail closed until the diagnostic output is understood");
  process.exit(1);
}
const [score, supported, partial, issues] = overall.slice(1).map(Number);
console.log(`VINEXT_COMPATIBILITY_SCORE=${score}`);
console.log(`VINEXT_SUPPORTED_IMPORTS=${supported}`);
console.log(`VINEXT_PARTIAL=${partial}`);
console.log(`VINEXT_ISSUES=${issues}`);
if (score < 100 || partial !== 0 || issues !== 0) {
  console.error("VINEXT_COMPATIBILITY_INCOMPLETE: this is a scanner result only, not deployment verification");
  process.exit(1);
}
console.log("VINEXT_SCANNER=PASS (does not certify a working Cloudflare Worker)");
