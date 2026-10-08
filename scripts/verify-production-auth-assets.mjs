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

async function verifyDeployment() {
  const res = await get(new URL("/api/deploy/version", base));
  if (!res.ok) throw new Error("DEPLOY_VERSION_HTTP_" + res.status);
  const value = await res.json();
  if (expected && value.commit !== expected) {
    throw new Error("DEPLOY_VERSION_CHANGED_BEFORE_ASSETS_CHECK");
  }
}

await verifyDeployment();
for (const route of ["/login", "/signup"]) {
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
  for (const url of chunks.slice(0, 16)) {
    const asset = await get(url);
    if (asset.status !== 200) {
      console.error("AUTH_ASSET_MISSING", route, asset.status, new URL(url).pathname);
      throw new Error("AUTH_ASSET_CHUNK_HTTP_" + asset.status);
    }
    const type = asset.headers.get("content-type") || "";
    if (!/javascript|ecmascript/.test(type)) {
      throw new Error("AUTH_ASSET_CHUNK_BAD_CONTENT_TYPE_" + type);
    }
    await asset.arrayBuffer();
  }
  console.log("DADYOOM_AUTH_ASSETS=PASS", route, "chunksChecked=" + Math.min(chunks.length,16));
}
await verifyDeployment();
console.log("DADYOOM_AUTH_ASSET_GATE=PASS");
