import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const file = readFileSync(resolve(process.cwd(), "types/cache-life.d.ts"), "utf8");

describe("cache declarations remain portable across supported Workers adapters", () => {
  it("does not import an internal Next.js cache implementation", () => {
    expect(file).not.toContain("next/dist/server/use-cache/cache-tag");
    expect(file).toContain("export function cacheTag(...tags: string[]): void");
    expect(file).toContain("export const unstable_cacheTag: typeof cacheTag");
  });
});
