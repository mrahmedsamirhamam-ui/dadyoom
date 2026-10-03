const SITE = (
  process.env.DADYOOM_INDEXNOW_SITE ||
  "https://dadyoom.dpdns.org"
).replace(/\/$/u, "");

const KEY = "7d8e3f1a2b4c5d6e7f8091a2b3c4d5e6";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

const urlList = [
  `${SITE}/`,
  `${SITE}/courses`,
  `${SITE}/courses/video-library`,
  `${SITE}/ask`,
  `${SITE}/pricing`,
  `${SITE}/bahrain`,
];

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyKey() {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(KEY_LOCATION, {
        headers: { "user-agent": "Dadyoom-IndexNow/1.0" },
      });
      const body = (await response.text()).trim();

      if (response.ok && body === KEY) {
        console.log("INDEXNOW_KEY=PASS");
        return true;
      }
    } catch {
      // Retry because the front door can lag the Worker deployment briefly.
    }

    if (attempt < 5) await sleep(2000);
  }

  console.warn("INDEXNOW_KEY=UNAVAILABLE");
  return false;
}

async function main() {
  try {
    const keyReady = await verifyKey();

    if (!keyReady) {
      console.warn("INDEXNOW_SUBMIT=SKIPPED");
      return;
    }

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "user-agent": "Dadyoom-IndexNow/1.0",
      },
      body: JSON.stringify({
        host: new URL(SITE).host,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`INDEXNOW_SUBMIT=PASS HTTP=${response.status}`);
      console.log(`INDEXNOW_URLS=${urlList.length}`);
      return;
    }

    console.warn(`INDEXNOW_SUBMIT=WARNING HTTP=${response.status}`);
  } catch (error) {
    console.warn(
      "INDEXNOW_SUBMIT=WARNING",
      error instanceof Error ? error.message : String(error),
    );
  }
}

await main();
