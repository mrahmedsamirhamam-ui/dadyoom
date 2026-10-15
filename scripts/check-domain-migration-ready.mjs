#!/usr/bin/env node
// Read-only preparedness check for a proposed .com migration.
// DOES NOT buy a domain, create DNS, change canonical, set secrets or deploy.
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const site = read("lib/site.ts");
const robots = read("app/robots.ts");
const sitemap = read("app/sitemap.ts");
const callback = read("app/auth/callback/route.ts");
const indexNow = read("scripts/submit-indexnow.mjs");
const deployment = read(".github/workflows/cloudflare-deploy.yml");
const wrangler = read("wrangler.jsonc");

const checks = {
  currentSitePreserved: site.includes("https://dadyoom.dpdns.org"),
  configurableCanonicalOrigin: site.includes("process.env.NEXT_PUBLIC_SITE_URL"),
  dynamicRobots: robots.includes("getSiteUrl()"),
  dynamicSitemap: sitemap.includes("getSiteUrl()"),
  oauthOriginFromRequest: callback.includes("url.origin"),
  indexNowCanChangeDomain: indexNow.includes("DADYOOM_INDEXNOW_SITE"),
  legacyDeployShaVerificationKnown: deployment.includes("https://dadyoom.dpdns.org") &&
    deployment.includes("/api/deploy/version"),
  workerAlreadyConfigured: wrangler.includes('"name": "dadyoom"'),
};
for (const [name, ok] of Object.entries(checks)) {
  console.log("DOMAIN_CODE_" + name + "=" + (ok ? "PASS" : "FAIL"));
}
if (Object.values(checks).some((ok) => !ok)) {
  console.error("DOMAIN_PREPARATION=CODE_REVIEW_FAILED");
  process.exitCode = 1;
} else {
  console.log("DOMAIN_PREPARATION=CODE_READY_ONLY");
}
console.log("TARGET_DOMAIN=dadyoom.com");
console.log("DOMAIN_AVAILABILITY=UNVERIFIED");
console.log("DOMAIN_OWNERSHIP=UNVERIFIED");
console.log("DOMAIN_PAYMENT=NOT_AUTHORIZED");
console.log("CLOUDFLARE_CUSTOM_DOMAIN=NOT_CONFIGURED_BY_THIS_SCRIPT");
console.log("OAUTH_REDIRECTS_AND_COOKIE_FLOW=NEEDS_REAL_DOMAIN_TEST");
console.log("CANONICAL_DNS_REDIRECTS=UNCHANGED");
console.log("CUTOVER=BLOCKED_PENDING_OWNERSHIP_AND_LIVE_QA");
