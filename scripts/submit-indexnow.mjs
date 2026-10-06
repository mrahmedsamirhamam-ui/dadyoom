const SITE = (
  process.env.DADYOOM_INDEXNOW_SITE ||
  "https://dadyoom.dpdns.org"
).replace(/\/$/u, "");

const KEY = "2795fa2980f0437d9ad8df7c6d430a0a";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const SITEMAP_URL = `${SITE}/sitemap.xml`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10000;

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyKey() {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(KEY_LOCATION, {
        headers: { "user-agent": "Dadyoom-IndexNow/2.0" },
      });
      const body = (await response.text()).trim();

      if (response.ok && body === KEY) {
        console.log("INDEXNOW_KEY=PASS");
        return true;
      }

      console.warn(
        `INDEXNOW_KEY_RETRY attempt=${attempt} http=${response.status}`,
      );
    } catch (error) {
      console.warn(
        `INDEXNOW_KEY_RETRY attempt=${attempt} error=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    if (attempt < 5) await sleep(2000);
  }

  console.warn("INDEXNOW_KEY=UNAVAILABLE");
  return false;
}

async function getSitemapUrls() {
  const response = await fetch(SITEMAP_URL, {
    headers: { "user-agent": "Dadyoom-IndexNow/2.0" },
  });

  if (!response.ok) {
    throw new Error(
      `SITEMAP_HTTP_${response.status}`,
    );
  }

  const xml = await response.text();
  const matches = [
    ...xml.matchAll(/<loc>([^<]+)<\/loc>/gu),
  ];

  const siteHost = new URL(SITE).host;
  const urls = [];
  const seen = new Set();

  for (const match of matches) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    const parsed = new URL(raw);

    if (parsed.protocol !== "https:" || parsed.host !== siteHost) {
      continue;
    }

    const normalized = parsed.toString();

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    urls.push(normalized);
  }

  if (urls.length === 0) {
    throw new Error("SITEMAP_EMPTY");
  }

  console.log(`INDEXNOW_SITEMAP_URLS=${urls.length}`);
  return urls;
}

async function submitBatch(urlList) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "user-agent": "Dadyoom-IndexNow/2.0",
    },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  if (response.status === 200 || response.status === 202) {
    console.log(
      `INDEXNOW_SUBMIT=PASS HTTP=${response.status} URLS=${urlList.length}`,
    );
    return;
  }

  const body = await response.text();

  throw new Error(
    `INDEXNOW_HTTP_${response.status}: ${body.slice(0, 500)}`,
  );
}

async function main() {
  const keyReady = await verifyKey();

  if (!keyReady) {
    throw new Error("INDEXNOW_KEY_UNAVAILABLE");
  }

  const urls = await getSitemapUrls();

  for (
    let start = 0;
    start < urls.length;
    start += MAX_URLS_PER_REQUEST
  ) {
    const batch = urls.slice(
      start,
      start + MAX_URLS_PER_REQUEST,
    );

    await submitBatch(batch);
  }

  console.log(`INDEXNOW_COMPLETE=PASS URLS=${urls.length}`);
}

await main();
