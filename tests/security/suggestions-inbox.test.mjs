import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (file) => readFileSync(file, "utf8");
describe("Dadyoom independent suggestions inbox", () => {
  it("routes to the existing secure support pipeline", () => {
    expect(read("app/suggestions/page.tsx")).toContain('<ContactForm initialCategory="suggestion" />');
    expect(read("components/contact/ContactForm.tsx")).toContain("defaultValue={initialCategory}");
    expect(read("app/api/contact/route.ts")).toContain('"suggestion"');
  });
  it("is discoverable and does not auto-approve ideas", () => {
    expect(read("app/page.tsx")).toContain('href="/suggestions"');
    expect(read("components/Navbar.tsx")).toContain('href: "/suggestions"');
    expect(read("app/sitemap.ts")).toContain("/suggestions");
    expect(read("app/suggestions/page.tsx")).toContain("لا يعني إرساله اعتمادًا تلقائيًا");
  });
});
