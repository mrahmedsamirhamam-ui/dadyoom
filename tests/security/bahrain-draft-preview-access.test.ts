import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canReadBahrainDraftPreview } from "../../features/lessons/services/bahrain-draft-preview-access";

const source = readFileSync(resolve(process.cwd(),
  "features/lessons/queries/getLessonPageBundle.ts"), "utf8");

describe("unpublished Bahrain lessons require a verified preview entitlement", () => {
  it.each(["BH", "bh", " Bahrain ", "البحرين"])(
    "allows a specifically authorized Bahrain test account (%s)",
    (country) => {
      expect(canReadBahrainDraftPreview(
        { dadyoom_bahrain_draft_preview: true }, country
      )).toBe(true);
    }
  );

  it.each([null, undefined, "", "AE", "SA", "QA", {}, ["BH"]])(
    "denies outside or absent verified country (%s)",
    (country) => {
      expect(canReadBahrainDraftPreview(
        { dadyoom_bahrain_draft_preview: true }, country
      )).toBe(false);
    }
  );

  it.each([undefined, null, {}, { dadyoom_bahrain_draft_preview: "true" },
    { dadyoom_bahrain_draft_preview: 1 },
    { country: "BH", role: "teacher" },
    { dadyoom_bahrain_draft_preview: false }])(
    "denies self-selected or absent app metadata (%s)",
    (metadata) => {
      expect(canReadBahrainDraftPreview(metadata, "BH")).toBe(false);
    }
  );

  it("checks the entitlement before constructing a service role client", () => {
    const auth = source.indexOf("supabase.auth.getUser()");
    const profile = source.indexOf('.from("profiles")');
    const gate = source.indexOf("if (!canReadBahrainDraftPreview(user.app_metadata, profile?.country))");
    const privileged = source.indexOf("const admin =");
    const privateLesson = source.indexOf('.from("lessons")', privileged);
    expect(auth).toBeGreaterThan(-1);
    expect(profile).toBeGreaterThan(auth);
    expect(gate).toBeGreaterThan(profile);
    expect(privileged).toBeGreaterThan(gate);
    expect(privateLesson).toBeGreaterThan(privileged);
    expect(source).not.toContain("user.user_metadata?.country");
    expect(source).toContain('process.env.DADYOOM_BAHRAIN_PREVIEW !==');
  });
});
