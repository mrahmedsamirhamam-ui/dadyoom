const SITE = (
  process.env.DADYOOM_INDEXNOW_SITE ||
  "https://dadyoom.dpdns.org"
).replace(/\/$/u, "");

const KEY = "2795fa2980f0437d9ad8df7c6d430a0a";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 50;

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

// Deliberately notify ONLY explicit changed URLs; a routine CI run must never
// resubmit thousands of unchanged sitemap entries to IndexNow.
function getChangedUrls() {
  const entries = (process.env.DADYOOM_INDEXNOW_PATHS || "")
    .split(/[\\n,]+/u)
    .map((value) => value.trim())
    .filter(Boolean);

  if (entries.length > 50) {
    throw new Error("INDEXNOW_TOO_MANY_CHANGED_URLS");
  }

  const site = new URL(SITE);
  const seen = new Set();
  const urls = [];
  for (const entry of entries) {
    const parsed = new URL(entry, site);
    if (parsed.origin !== site.origin || parsed.search || parsed.hash ||
        !parsed.pathname.startsWith("/") ||
        /^\\/(?:api|admin|student|teacher|school|parent|child|login|signup|onboarding|payments|profile)(?:\\/|$)/u.test(parsed.pathname)) {
      throw new Error("INDEXNOW_NONPUBLIC_OR_OFFSITE_URL");
    }
    const canonical = parsed.toString();
    if (!seen.has(canonical)) {
      seen.add(canonical);
      urls.push(canonical);
    }
  }
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
  const urls = getChangedUrls();
  if (urls.length === 0) {
    console.log("INDEXNOW=SKIPPED_NO_CHANGED_URLS");
    return;
  }

  const keyReady = await verifyKey();

  if (!keyReady) {
    throw new Error("INDEXNOW_KEY_UNAVAILABLE");
  }

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
