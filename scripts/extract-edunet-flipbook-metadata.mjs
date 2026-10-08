import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OFFICIAL_HOSTS = new Set(["edunet.bh", "www.edunet.bh"]);

export function officialUrl(candidate, base) {
  let parsed;
  try {
    parsed = new URL(candidate, base);
  } catch {
    throw new Error("INVALID_OFFICIAL_BOOK_URL");
  }
  if (parsed.protocol !== "https:" || !OFFICIAL_HOSTS.has(parsed.hostname)) {
    throw new Error("UNTRUSTED_OFFICIAL_BOOK_HOST");
  }
  return parsed.href;
}

export function parseHtmlConfig(source) {
  const prefix = /\b(?:var|let|const)\s+htmlConfig\s*=\s*\{/m.exec(source);
  if (!prefix) throw new Error("FLIPBOOK_CONFIG_NOT_FOUND");
  const start = prefix.index + prefix[0].length - 1;
  let depth = 0;
  let inside = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inside) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inside = false;
      continue;
    }
    if (char === '"') {
      inside = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const config = JSON.parse(source.slice(start, index + 1));
        if (!Array.isArray(config.fliphtml5_pages) || config.fliphtml5_pages.length < 1) {
          throw new Error("FLIPBOOK_PAGE_LIST_MISSING");
        }
        return config;
      }
    }
  }
  throw new Error("FLIPBOOK_CONFIG_UNTERMINATED");
}

export function extractBookMetadata(configSource, viewerUrl) {
  const viewer = officialUrl(viewerUrl);
  const config = parseHtmlConfig(configSource);
  const pageCount = config.fliphtml5_pages.length;
  const rawDownload = config.downloadconfig?.pdf?.url;
  const pdfUrl = typeof rawDownload === "string" && rawDownload.trim()
    ? officialUrl(rawDownload, viewer)
    : null;
  const rawOutlineCount = Array.isArray(config.ols) ? config.ols.length : 0;
  return {
    schemaVersion: 1,
    source: "Bahrain Ministry Edunet FlipHTML5",
    viewerUrl: viewer,
    configurationUrl: officialUrl("javascript/config.js", viewer),
    pdfUrl,
    viewerPageCount: pageCount,
    rawViewerOutlineCount: rawOutlineCount,
    tocEntryCount: null,
    tocVerified: false,
    status: "PENDING_HUMAN_TOC_MATCH",
    warning: "Viewer pages and raw outline entries are not textbook lessons. Never mark COMPLETE_BOOK without checked TOC."
  };
}

async function main(args) {
  const get = key => {
    const i = args.indexOf(key);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const viewerUrl = get("--viewer-url");
  const configFile = get("--config-file");
  const output = get("--output");
  if (!viewerUrl) throw new Error("MISSING_--viewer-url");
  const safeViewer = officialUrl(viewerUrl);
  let content;
  if (configFile) {
    content = await fs.readFile(configFile, "utf8");
  } else {
    const url = officialUrl("javascript/config.js", safeViewer);
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error("EDUNET_CONFIG_FETCH_HTTP_" + response.status);
    content = await response.text();
  }
  const metadata = extractBookMetadata(content, safeViewer);
  const serialized = JSON.stringify(metadata, null, 2) + "\n";
  if (output) {
    await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true });
    await fs.writeFile(output, serialized, "utf8");
  }
  process.stdout.write(serialized);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error("EDUNET_FLIPBOOK_AUDIT_FAILED:", error.message);
    process.exitCode = 1;
  });
}
