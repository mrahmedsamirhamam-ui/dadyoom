// Verify that current auth HTML references client bundles that Cloudflare serves.
// Do not treat a successful Worker API deployment as sufficient for browser login.
const base = process.env.DADYOOM_BASE_URL || "https://dadyoom.dpdns.org";
const expected = process.env.EXPECTED_SHA || "";

async function get(url) {
  return fetch(url, {
    redirect: "follow",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}

async function deploymentCommit() {
  const res = await get(new URL("/api/deploy/version", base));
  if (!res.ok) throw new Error("DEPLOY_VERSION_HTTP_" + res.status);
  const value = await res.json();
  return String(value.commit || "");
}

async function verifyDeployment() {
  // Different Cloudflare edges may briefly serve old and new versions
  // during rollout. Recheck with bounded backoff rather than treating one
  // stale edge response as a confirmed broken deployment.
  let lastObserved = "";
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      lastObserved = await deploymentCommit();
      if (!expected || lastObserved === expected) return lastObserved;
      console.warn("AUTH_ASSET_DEPLOY_VERSION_RETRY", {
        attempt,
        expected,
        actual: lastObserved,
      });
    } catch (error) {
      if (attempt === 5) throw error;
      console.warn("AUTH_ASSET_DEPLOY_READ_RETRY", {
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    if (attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  console.error("AUTH_ASSET_DEPLOY_SHA_MISMATCH", {
    expected,
    actual: lastObserved,
  });
  throw new Error("DEPLOY_VERSION_CHANGED_DURING_ASSETS_CHECK");
}

await verifyDeployment();
// During Cloudflare static asset rollout, the API commit can switch before
// the corresponding immutable JS chunks are readable on every edge. Do not
// issue a false PASS on one matching version endpoint. Give the asset layer
// a short warm-up period, then verify every referenced chunk strictly.
await new Promise((resolve) => setTimeout(resolve, 8_000));
await verifyDeployment();
// The homepage shares the root runtime/chunks used by the auth pages.
for (const route of ["/", "/login", "/signup"]) {
  const startingCommit = await verifyDeployment();
  const response = await get(new URL(route + "?auth_asset_check=" + Date.now(), base));
  if (!response.ok) throw new Error("AUTH_ASSET_PAGE_HTTP_" + route + "_" + response.status);
  const html = await response.text();
  const chunks = [...new Set(
    [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gu)]
      .map((match) => match[1])
      .filter((url) => url.includes("/_next/static/chunks/") &&
        /\.js(?:\?|$)/u.test(url))
      .map((url) => new URL(url, base).toString()),
  )];
  if (chunks.length === 0) throw new Error("AUTH_ASSET_NO_CLIENT_CHUNKS_" + route);
  // Check *all* JS URLs directly referenced in this HTML, not just the first
  // 16. Bound parallelism to avoid stressing Cloudflare during deployment.
  for (let offset = 0; offset < chunks.length; offset += 6) {
    const batch = chunks.slice(offset, offset + 6);
    await Promise.all(batch.map(async (url) => {
      // Retry ONLY rollout-shaped errors, not redirects or wrong content.
      // A permanently missing client chunk MUST fail the release.
      const retryable = new Set([404, 429, 502, 503, 504]);
      let verified = false;
      let lastStatus = 0;
      let lastRay = "unavailable";
      let lastType = "";
      for (let attempt = 1; attempt <= 6; attempt += 1) {
        let asset;
        try {
          asset = await get(url);
        } catch (error) {
          if (attempt === 6) throw error;
          console.warn("AUTH_ASSET_FETCH_RETRY", {
            route,
            attempt,
            chunkPath: new URL(url).pathname,
            reason: error instanceof Error ? error.message : String(error),
          });
          await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
          continue;
        }
        lastStatus = asset.status;
        lastRay = asset.headers.get("cf-ray") || "unavailable";
        lastType = asset.headers.get("content-type") || "";

        if (asset.status === 200) {
          if (!/javascript|ecmascript/.test(lastType)) {
            throw new Error("AUTH_ASSET_CHUNK_BAD_CONTENT_TYPE_" + lastType);
          }
          await asset.arrayBuffer();
          verified = true;
          break;
        }
        if (!retryable.has(lastStatus) || attempt === 6) break;
        console.warn("AUTH_ASSET_EDGE_RETRY", {
          route,
          attempt,
          httpStatus: lastStatus,
          chunkPath: new URL(url).pathname,
          cfRay: lastRay,
        });
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
      if (!verified) {
        // Persistent 404/503 is still a HARD FAILURE. Even if the route's
        // metadata commit matched, the actual browser cannot load this JS.
        const observedCommit = await deploymentCommit().catch(() => "unavailable");
        console.error("AUTH_ASSET_MISSING", {
          route,
          httpStatus: lastStatus,
          chunkPath: new URL(url).pathname,
          cfRay: lastRay,
          contentType: lastType,
          htmlRay: response.headers.get("cf-ray") || "unavailable",
          expectedCommit: expected,
          startingCommit,
          observedCommit,
          checks: 6,
        });
        throw new Error("AUTH_ASSET_CHUNK_HTTP_" + lastStatus);
      }
    }));
  }
  const completedCommit = await verifyDeployment();
  console.log("DADYOOM_AUTH_ASSETS=PASS", route,
    "chunksChecked=" + chunks.length,
    "commit=" + completedCommit);
}
// The OAuth callback must be a real, uncached Route Handler in production.
// A missing or intercepted callback makes Google sign-in appear to loop.
const callbackResponse = await fetch(
  new URL("/auth/callback?auth_route_probe=1", base),
  { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(20_000) },
);
const callbackLocation = callbackResponse.headers.get("location") || "";
if (![302, 303, 307, 308].includes(callbackResponse.status) ||
    !callbackLocation.includes("/login?error=oauth_callback")) {
  throw new Error("AUTH_OAUTH_CALLBACK_ROUTE_BAD_RESPONSE_" + callbackResponse.status);
}
console.log("DADYOOM_OAUTH_CALLBACK_ROUTE=PASS", "status=" + callbackResponse.status);
await verifyDeployment();
console.log("DADYOOM_AUTH_ASSET_GATE=PASS");
