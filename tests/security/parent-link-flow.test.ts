import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const parentPage = read("app/(dashboard)/parent/page.tsx");
const studentPage = read("app/(dashboard)/student/page.tsx");
const parentLink = read("features/parent-link/actions/linkChildByCode.ts");
const createCode = read("features/parent-link/actions/createParentLinkCode.ts");

describe("parent-child linking feedback and privacy", () => {
  it("shows parent linking feedback returned from the action", () => {
    expect(parentPage).toContain("linkSuccess === \"linked\"");
    expect(parentPage).toContain('linkSuccess === "already-linked"');
    expect(parentPage).toContain("successMessage={successMessage}");
    expect(parentPage).toContain("errorMessage={errorMessage}");
    expect(parentPage).not.toContain("سنضيف في الخطوة التالية طريقة آمنة");
  });

  it("shows the student code-generation result next to the active code", () => {
    expect(studentPage).toContain('parentLinkSuccess === "created"');
    expect(studentPage).toContain('parentLinkError === "failed"');
    expect(studentPage).toContain("code={parentLinkCode}");
    expect(studentPage).toContain("<StudentParentLinkCard");
  });

  it("never places one-time codes or database error messages in redirect URLs", () => {
    expect(createCode).toContain('redirect("/student?parentLinkSuccess=created")');
    expect(createCode).toContain('redirect("/student?parentLinkError=failed")');
    expect(parentLink).toContain('"/parent?linkSuccess=linked"');
    expect(parentLink).toContain('"/parent?linkSuccess=already-linked"');
    expect(parentLink).toContain('redirect("/parent?linkError=invalid")');
    expect(createCode).not.toContain("result?.code");
    expect(parentLink).not.toContain("result?.student_name");
    expect(createCode).not.toContain("error.message");
    expect(parentLink).not.toContain("error.message");
    expect(createCode).not.toContain("encodeURIComponent");
    expect(parentLink).not.toContain("encodeURIComponent");
  });

  it("checks authenticated parent role before calling the privileged RPC", () => {
    const auth = parentLink.indexOf("supabase.auth.getUser()");
    const role = parentLink.indexOf('.select("role")');
    const rpc = parentLink.indexOf('"link_child_by_code"');
    expect(auth).toBeGreaterThan(-1);
    expect(role).toBeGreaterThan(auth);
    expect(rpc).toBeGreaterThan(role);
    expect(parentLink).toContain('role !== "parent" && role !== "admin"');
    expect(parentLink).toContain('code.length > 64');
    expect(parentLink).toContain('"ولي أمر"');
    expect(parentLink).toContain('revalidatePath("/parent")');
  });

  it("continues using the database-approved one-time code RPC", () => {
    expect(createCode).toContain('"create_parent_link_code"');
    expect(createCode).toContain('revalidatePath("/student")');
    expect(parentLink).toContain('"link_child_by_code"');
  });
});
