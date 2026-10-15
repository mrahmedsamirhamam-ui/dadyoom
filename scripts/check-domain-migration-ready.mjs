#!/usr/bin/env node
// Read-only code audit after dadyoom.com was registered and attached to Worker.
// No network, registrar, Supabase, DNS, secrets or deployment mutations.
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const site = read("lib/site.ts");
const proxy = read("proxy.ts");
const brandSitemap = read("public/sitemap-brand.xml");
const robots = read("app/robots.ts");
const sitemap = read("app/sitemap.ts");
const callback = read("app/auth/callback/route.ts");
const indexNow = read("scripts/submit-indexnow.mjs");
const deployment = read(".github/workflows/cloudflare-deploy.yml");
const wrangler = read("wrangler.jsonc");

const checks = {
  newCanonicalDefault: site.includes("https://dadyoom.com"),
  legacyHostPreservedForNonpublicRoutes: proxy.includes('"dadyoom.dpdns.org"'),
  legacySeoRedirectTargetsCom: proxy.includes('"dadyoom.com"'),
  brandSitemapNowCanonical: brandSitemap.includes("https://dadyoom.com/") &&
    !brandSitemap.includes("dadyoom.dpdns.org"),
  configurableCanonicalOrigin: site.includes("process.env.NEXT_PUBLIC_SITE_URL"),
  dynamicRobots: robots.includes("getSiteUrl()"),
  dynamicSitemap: sitemap.includes("getSiteUrl()"),
  singleRobotsSitemap: robots.includes('sitemap: [`${base}/sitemap.xml`]'),
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
console.log("DOMAIN_OWNERSHIP=EXTERNAL_ACCOUNT_VERIFICATION_REQUIRED");
console.log("DOMAIN_PAYMENT=NEVER_EXECUTED_BY_SCRIPT");
console.log("CLOUDFLARE_CUSTOM_DOMAIN=NOT_MODIFIED_BY_THIS_SCRIPT");
console.log("AUTH_AND_CANONICAL_LIVE_QA=EXTERNAL_VERIFICATION_REQUIRED");
console.log("CANONICAL_DNS_REDIRECTS=NOT_MODIFIED_BY_THIS_SCRIPT");
console.log("CUTOVER=VERIFY_LIVE_SEO_AND_SEARCH_CONSOLE");
