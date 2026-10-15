import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path) => readFileSync(path, "utf8");
const form = read("components/contact/ContactForm.tsx");
const api = read("app/api/contact/route.ts");
const contact = read("app/contact/page.tsx");
const admin = read("app/admin/support/page.tsx");
const action = read("app/admin/support/actions.ts");
const migration = read("supabase/migrations/20261015180000_dadyoom_private_support_tickets.sql");
const layout = read("app/admin/layout.tsx");

describe("Dadyoom public contact and private support", () => {
  test("public contact offers a working form without invented contact details", () => {
    expect(contact).toContain("<ContactForm />");
    expect(form).toContain('fetch("/api/contact"');
    expect(form).toContain('name="consent"');
    expect(form).toContain('name="website"');
    expect(form).toContain('name="pageUrl"');
    expect(contact).toContain("DADYOOM_CONTACT_EMAIL");
    expect(contact).toContain("DADYOOM_CONTACT_WHATSAPP");
    expect(contact).not.toContain("example@gmail.com");
  });
  test("public backend validates origin, body, spam and rate limits without token leakage", () => {
    expect(api).toContain('request.headers.get("origin")');
    expect(api).toContain('application/json');
    expect(api).toContain('clean(body.website)');
    expect(api).toContain('body.consent === true');
    expect(api).toContain('createHmac("sha256"');
    expect(api).toContain('(recent.count ?? 0) >= 3');
    expect(api).toContain('createAdminClient()');
    expect(api).not.toContain('console.log(body)');
    expect(api).not.toContain("SUPABASE_SERVICE_ROLE_KEY=");
  });
  test("database messages remain inaccessible to anonymous or authenticated direct clients", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on table public.support_tickets from public, anon, authenticated");
    expect(migration).toContain("grant select, insert, update on table public.support_tickets to service_role");
    expect(migration).not.toContain("to anon;");
    expect(migration).not.toContain("to authenticated;");
  });
  test("admin inbox is protected by profile role and server action authorizes edits", () => {
    expect(layout).toContain('profile?.role?.trim().toLowerCase() !== "admin"');
    expect(admin).toContain('profile?.role?.trim().toLowerCase() !== "admin"');
    expect(action).toContain('profile?.role?.trim().toLowerCase() !== "admin"');
    expect(action).toContain("revalidatePath");
    expect(admin).toContain("updateSupportTicket");
    expect(layout).toContain('/admin/support');
  });
});
