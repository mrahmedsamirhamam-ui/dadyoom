import { describe, expect, it } from "vitest";
import { groupPublicDirectoryLessons, type DirectoryLesson } from "../../lib/curriculum/public-directory-grouping";

const base: DirectoryLesson = {
  id: "l1", title: "القراءة", grade_number: 10, grade_name: "الأول الثانوي",
  curriculum_id: "core", curriculum_name: "اللغة العربية — توحيد المسارات — الفصل الأول",
  unit_id: "unit-core", unit_title: "القراءة والنصوص", unit_number: 1,
  unit_sort_order: 1, unit_semester: 1, lesson_semester: 1,
  lesson_number: 1, sort_order: 1,
};
describe("public directory secondary pathway separation", () => {
  it("preserves different tracks sharing exactly the same unit title and order", () => {
    const rows: DirectoryLesson[] = [
      base,
      { ...base, id:"l2", curriculum_id:"vocational", curriculum_name:"اللغة العربية — التعليم الفني والمهني — الفصل الأول", unit_id:"unit-voc" },
      { ...base, id:"l3", curriculum_id:"vocational", curriculum_name:"اللغة العربية — التعليم الفني والمهني — الفصل الأول", unit_id:"unit-voc", title:"التعبير", lesson_number:2, sort_order:2 },
    ];
    const grouped = groupPublicDirectoryLessons(rows);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].tracks).toHaveLength(2);
    expect(grouped[0].tracks.reduce((n,t)=>n+t.lessonCount,0)).toBe(3);
    expect(grouped[0].tracks.flatMap(t=>t.units).map(u=>u.id)).toEqual(["unit-voc","unit-core"]);
    expect(grouped[0].tracks.find(t=>t.id==="vocational")?.units[0].lessons.map(l=>l.id)).toEqual(["l2","l3"]);
  });
  it("collapses duplicate grade labels while keeping every pathway unique", () => {
    const rows: DirectoryLesson[] = [
      base,
      { ...base, id:"l2", grade_name:"الصف الأول الثانوي", curriculum_id:"other", curriculum_name:"مختلف", unit_id:"unit-2" },
      { ...base, id:"l3", grade_number:11, grade_name:"الثاني الثانوي", unit_id:"unit-g11" },
    ];
    const output = groupPublicDirectoryLessons(rows);
    expect(output.map(g=>g.gradeNumber)).toEqual([10,11]);
    expect(output[0].gradeName).toBe("الصف الأول الثانوي");
    expect(output[0].tracks).toHaveLength(2);
  });
  it("keeps different semesters/edition units separate and orders first-term before second-part", () => {
    const second = { ...base, id:"l2", curriculum_id:"second", curriculum_name:"اللغة العربية — توحيد المسارات — الجزء الثاني (محتوى كتاب رسمي)",unit_id:"second-unit",unit_semester:2,lesson_semester:2 };
    const out = groupPublicDirectoryLessons([second,base]);
    expect(out[0].tracks.map(x=>x.id)).toEqual(["core","second"]);
    expect(out[0].tracks[1].units[0].semester).toBe(2);
  });
});
