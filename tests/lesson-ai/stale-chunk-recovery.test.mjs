import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test, expect } from "vitest";

const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
const scriptMatch = layout.match(/const staleChunkRecoveryScript = String\.raw\x60([\s\S]*?)\x60;/u);

function boot(path = "/login") {
  expect(scriptMatch).not.toBeNull();
  const handlers = new Map();
  const records = new Map();
  const replaced = [];
  const location = {
    href: "https://dadyoom.dpdns.org" + path,
    origin: "https://dadyoom.dpdns.org",
    pathname: path.split("?")[0],
    replace: target => replaced.push(target),
  };
  const window = {
    location,
    sessionStorage: {
      getItem: key => records.get(key) ?? null,
      setItem: (key, value) => records.set(key, value),
    },
    addEventListener: (type, handler) => handlers.set(type, handler),
  };
  vm.runInNewContext(scriptMatch[1], { window, URL, Date, JSON, String, Number }, { timeout: 1000 });
  return { handlers, replaced };
}

test("stale own-origin chunk recovers once, without an infinite reload loop", () => {
  const { handlers, replaced } = boot();
  const broken = { target: { src: "https://dadyoom.dpdns.org/_next/static/chunks/OldForm-abc.js" } };
  handlers.get("error")(broken);
  handlers.get("error")(broken);
  expect(replaced).toHaveLength(1);
  expect(new URL(replaced[0]).searchParams.has("dadyoom_asset_retry")).toBe(true);
});

test("unrelated and cross-origin scripts cannot trigger automatic reload", () => {
  const { handlers, replaced } = boot();
  handlers.get("error")({ target: { src: "https://cdn.other.test/_next/static/chunks/missing.js" } });
  handlers.get("unhandledrejection")({ reason: new Error("Unrelated network problem") });
  expect(replaced).toHaveLength(0);
});

test("the OAuth callback and code exchanges are not replayed", () => {
  for (const path of ["/auth/callback", "/login?code=one-time"]) {
    const { handlers, replaced } = boot(path);
    handlers.get("unhandledrejection")({
      reason: new Error("Failed to fetch dynamically imported module: https://dadyoom.dpdns.org/_next/static/chunks/old.js"),
    });
    expect(replaced).toHaveLength(0);
  }
});
