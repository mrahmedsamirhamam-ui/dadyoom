import http from "node:http";
import https from "node:https";
import { afterEach, beforeEach, expect, vi } from "vitest";

// Never allow a missed mock to contact a payment provider or a database.
function networkDisabled(): never {
  throw new Error("NETWORK_DISABLED_IN_SECURITY_TESTS");
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(networkDisabled));
  vi.spyOn(http, "request").mockImplementation(networkDisabled);
  vi.spyOn(http, "get").mockImplementation(networkDisabled);
  vi.spyOn(https, "request").mockImplementation(networkDisabled);
  vi.spyOn(https, "get").mockImplementation(networkDisabled);
});

afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  expect(http.request).not.toHaveBeenCalled();
  expect(http.get).not.toHaveBeenCalled();
  expect(https.request).not.toHaveBeenCalled();
  expect(https.get).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});