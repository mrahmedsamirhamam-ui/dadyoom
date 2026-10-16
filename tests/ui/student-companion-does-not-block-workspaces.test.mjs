import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";

const runtime = readFileSync("components/runtime/DadyoomClientRuntime.tsx", "utf8");
const companion = readFileSync("components/dad-ai/DadCompanion.tsx", "utf8");

describe("Floating AI companion must not block lesson or school form actions", () => {
  test("teacher, school, admin, parent and checkout workspaces use their own UI without the student companion", () => {
    expect(runtime).toContain("usePathname()");
    expect(runtime).toContain("workflowWorkspace");
    expect(runtime).toContain("teacher|school|admin|parent|login|signup|register|onboarding|checkout|settings");
    expect(runtime).toContain("workflowWorkspace ? null : <DadCompanion />");
  });

  test("only interactive launcher and expanded assistant panels intercept clicks", () => {
    expect(companion).toContain('className="pointer-events-none absolute bottom-0 left-0"');
    expect(companion).toContain('className="pointer-events-auto mb-4 flex');
    expect(companion).toContain('className="pointer-events-auto relative grid h-[58px]');
    expect(companion).toContain('className="pointer-events-auto absolute -top-7 left-0');
    expect(companion).not.toContain('className="pointer-events-auto absolute bottom-0 right-0"');
  });

  test("student companion remains opt-in and closable", () => {
    expect(companion).toContain("const [isOpen, setIsOpen] = useState(false)");
    expect(companion).toContain('aria-label="إغلاق ضاد"');
    expect(companion).toContain("onClick={() => setIsOpen((value) => !value)}");
  });
});
