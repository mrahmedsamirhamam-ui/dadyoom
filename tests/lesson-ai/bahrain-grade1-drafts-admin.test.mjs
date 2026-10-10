import { readFileSync } from "node:fs";
import {expect,test} from "vitest";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("grade-one draft review is admin-linked, read-only and compares live content",()=>{
 const page=read("app/admin/curriculum/coverage/assessments/drafts/page.tsx");
 const parent=read("app/admin/curriculum/coverage/assessments/page.tsx");
 expect(parent).toContain("/admin/curriculum/coverage/assessments/drafts");
 expect(page).toContain('drafts.items.map');
 expect(page).toContain('row.is_published');
 expect(page).toContain('unchanged');
 expect(page).toContain('content->>origin');
 expect(page).toContain('لم تُعتمد مطابقتها');
 for(const cmd of [".update(",".delete(",".insert(","createServiceRoleClient"])expect(page).not.toContain(cmd);
});
