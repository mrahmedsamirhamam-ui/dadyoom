import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const s=readFileSync("app/(dashboard)/teacher/classroom/TeacherClassroomClient.tsx","utf8");
describe("React effect safety in RLS-loaded teacher classroom",()=>{
  test("initial loading state is defined outside the effect and not set synchronously",()=>{
    expect(s).toContain('useState(Boolean(props.classes.length))');
    expect(s).toContain('if (!props.classes.length) return;');
    expect(s).not.toContain('if (!props.classes.length) {\n      setLoadingExtras(false);');
    expect(s).not.toContain('async function loadSupplemental() {\n      setLoadingExtras(true);');
  });
  test("status updater exists before effect, not declared after it",()=>{
    expect(s.indexOf('const [status, setStatus] = useState("")')).toBeLessThan(s.indexOf('useEffect(() =>'));
    expect(s.match(/const \[status, setStatus\] = useState\(" "\)/g)).toBeNull();
    expect(s.match(/const \[status, setStatus\] = useState\(" "\)/g)).toBeNull();
    expect(s.split('const [status, setStatus] = useState("")').length).toBe(2);
  });
});
