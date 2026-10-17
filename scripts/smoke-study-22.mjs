import { readFileSync } from "node:fs";

const source = readFileSync("lib/countries.ts", "utf8");
const block = source.match(/export const ARAB_COUNTRY_CODES = \[([\s\S]*?)\] as const;/u);
if (!block) throw new Error("STUDY_22_SOURCE_MISSING");
const codes = [...block[1].matchAll(/"([A-Z]{2})"/gu)].map(match => match[1]);
if (codes.length !== 22 || new Set(codes).size !== 22) {
  throw new Error("STUDY_22_COUNTRY_LIST_UNVERIFIED count=" + codes.length);
}
const base = process.env.DADYOOM_BASE_URL ?? "https://dadyoom.com";
const checks = [
  { path: "/study", required: ["ابدأ مذاكرة العربية", "اختر صفك لبدء المذاكرة"] },
  ...codes.map(code => ({
    path: "/study/" + code.toLowerCase() + "/1",
    required: ["ذاكر العربية", "مثال محلول", "أطبق بنفسي", "قارِن إجابتي بالمفتاح"],
  })),
  ...["mr", "tn"].map(code => ({
    path: "/study/" + code + "/13",
    required: ["ذاكر العربية", "أطبق بنفسي:"],
  })),
];
let passed = 0;
for (const item of checks) {
  let worked = false;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);
    try {
      const response = await fetch(new URL(item.path, base), {
        redirect: "follow", cache: "no-store",
        headers: { "User-Agent": "DadyoomReleaseQA/1.0" },
        signal: controller.signal,
      });
      const html = await response.text();
      if (response.ok && item.required.every(phrase => html.includes(phrase))) {
        console.log("STUDY_22_PAGE=PASS path=" + item.path + " attempt=" + attempt);
        worked = true;
        break;
      }
      console.error("STUDY_22_PAGE=RETRY path=" + item.path + " status=" + response.status +
        " missing=" + item.required.filter(x => !html.includes(x)).join("|"));
    } catch (cause) {
      console.error("STUDY_22_PAGE=RETRY path=" + item.path + " error=" +
        (cause instanceof Error ? cause.name : "UNKNOWN"));
    } finally {
      clearTimeout(timeout);
    }
  }
  if (!worked) throw new Error("STUDY_22_PAGE=FAIL path=" + item.path);
  passed++;
}
console.log("STUDY_22_PRODUCTION=PASS sampled_pages=" + passed +
  " countries=" + codes.length + " method=HTTP_HTML");
