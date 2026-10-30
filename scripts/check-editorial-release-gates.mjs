#!/usr/bin/env node
/**
 * Dadyoom editorial release gate. A PASS here means status records are internally
 * consistent, NOT that any content has undergone pedagogical review.
 *
 * Usage:
 *   node scripts/check-editorial-release-gates.mjs
 *   node scripts/check-editorial-release-gates.mjs --require-ready <product-id>
 */
import { readFileSync } from "node:fs";

const file = new URL("../data/quality/EDITORIAL_RELEASE_STATUS.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
const required = data.requiredEvidence;
const ids = new Set();
if (!Array.isArray(required) || required.length < 8) throw new Error("Incomplete review matrix.");
if (!Array.isArray(data.products) || data.products.length < 1) throw new Error("Missing products.");

for (const p of data.products) {
  if (!p.id || ids.has(p.id)) throw new Error(`Invalid or duplicate product id: ${p.id}`);
  ids.add(p.id);
  if (!Array.isArray(p.blocking_reasons) || !p.evidence || typeof p.evidence !== "object") throw new Error(`Malformed review: ${p.id}`);
  const ready = required.every(key => p.evidence[key]?.approved === true &&
    typeof p.evidence[key]?.reviewer === "string" &&
    p.evidence[key].reviewer.trim().length > 0 &&
    typeof p.evidence[key]?.reviewed_at === "string" &&
    !Number.isNaN(Date.parse(p.evidence[key].reviewed_at)) &&
    typeof p.evidence[key]?.proof === "string" &&
    p.evidence[key].proof.trim().length > 0);
  if (p.release_status === "approved" && (!ready || p.blocking_reasons.length > 0)) {
    throw new Error(`Release ${p.id} marked approved without all reviewed evidence or while blocking issues remain.`);
  }
  console.log(`${p.id}: ${p.release_status} (${p.blocking_reasons.length} blocker(s))`);
}

if (process.argv[2] === "--require-ready") {
  const target = process.argv[3];
  if (!target) throw new Error("--require-ready requires a product id");
  const product = data.products.find(p => p.id === target);
  if (!product) throw new Error(`Unknown product: ${target}`);
  if (product.release_status !== "approved") {
    console.error(`BLOCKED: ${product.name} has not passed pedagogical/editorial approval.`);
    process.exitCode = 1;
  }
}
