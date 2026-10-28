import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePublicAssetPath } from "../../lib/curriculum/resolve-public-asset-path";

const repoRoot = resolve("/tmp", "dadyoom-fixture");
const publicRoot = resolve(repoRoot, "public");

describe("curriculum runtime-audit local asset path boundary", () => {
  it("resolves genuine same-origin public files only within the public directory", () => {
    expect(resolvePublicAssetPath(
      "/curriculum/bahrain/grade-01/lesson-13/page-142.jpg", repoRoot,
    )).toBe(resolve(publicRoot, "curriculum/bahrain/grade-01/lesson-13/page-142.jpg"));
    expect(resolvePublicAssetPath("/صور/درس-١.jpg", repoRoot))
      .toBe(resolve(publicRoot, "صور/درس-١.jpg"));
  });

  it("denies URL and filesystem traversal including encoded, Windows and UNC variants", () => {
    const bad: unknown[] = [
      undefined,
      null,
      123,
      "",
      "../.env",
      "curriculum/image.png",
      "//remote/share.jpg",
      "/../.env",
      "/curriculum/../../.env",
      "/curriculum/./image.jpg",
      "/curriculum//image.jpg",
      "/curriculum/%2e%2e/.env",
      "/curriculum/%2f../.env",
      "/curriculum/..%2f.env",
      "/curriculum/%252e%252e/secret",
      "/curriculum/..\\.env",
      "/curriculum/image.jpg?../../.env",
      "/curriculum/image.jpg#secret",
      "/C:/Windows/win.ini",
      "/curriculum/a:b.png",
      "/a\u0000b",
      "/a\u001fb",
    ];
    for (const input of bad) {
      expect(resolvePublicAssetPath(input, repoRoot), String(input)).toBeNull();
    }
  });

  it("the privileged runtime route uses the constrained resolver and flags invalid assets", () => {
    const route = readFileSync(
      resolve(process.cwd(), "app/api/admin/lessons/runtime-audit/route.ts"),
      "utf8",
    );
    expect(route).toContain('import { resolvePublicAssetPath }');
    expect(route).toContain("resolvePublicAssetPath(");
    expect(route).not.toContain("function publicUrlToPath(");
    expect(route).toContain("Invalid/traversal paths are broken assets");
    expect(route).toContain("RUNTIME_MAIN_IMAGE_MISSING");
    expect(route).toContain("RUNTIME_IMAGE_OPTION_MISSING");
  });
});
