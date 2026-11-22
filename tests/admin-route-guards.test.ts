import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../app/api/admin", import.meta.url));
function getAdminRoutes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? getAdminRoutes(path) : entry.name === "route.ts" ? [path] : [];
  });
}
describe("Admin API defense-in-depth", () => {
  const adminRoutes = getAdminRoutes(root);
  it("protects all currently registered admin API handlers", () => {
    expect(adminRoutes.length).toBeGreaterThanOrEqual(19);
  });
  for (const route of adminRoutes) {
    it(`checks admin privileges before handling requests in ${route}`, () => {
      const source = readFileSync(route, "utf8");
      expect(source).toContain('import { requireAdminResponse } from "@/lib/auth/require-admin"');
      const handlers = [...source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\([^]*?\)\s*\{/g)];
      expect(handlers.length).toBeGreaterThan(0);
      for (const handler of handlers) {
        const i = (handler.index ?? 0) + handler[0].length;
        const opening = source.slice(i, i + 230);
        expect(opening).toContain("const rejectedAdminRequest = await requireAdminResponse();");
        expect(opening).toContain("if (rejectedAdminRequest) return rejectedAdminRequest;");
      }
    });
  }
});
