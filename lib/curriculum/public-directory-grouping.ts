// Public directory grouping. Names and sort numbers are not unique across
// secondary pathways; the immutable curriculum/grade/unit IDs are.
export type DirectoryLesson = {
  id: string;
  title: string;
  grade_number: number | null;
  grade_name: string;
  curriculum_id: string;
  curriculum_name: string;
  unit_id: string;
  unit_title: string;
  unit_number: number | null;
  unit_sort_order: number | null;
  unit_semester: number | null;
  lesson_semester: number | null;
  lesson_number: number | null;
  sort_order: number | null;
};

export type DirectoryUnit<T extends DirectoryLesson> = {
  id: string;
  title: string;
  order: number;
  semester: number | null;
  lessons: T[];
};
export type DirectoryTrack<T extends DirectoryLesson> = {
  id: string;
  name: string;
  units: DirectoryUnit<T>[];
  lessonCount: number;
};
export type DirectoryGrade<T extends DirectoryLesson> = {
  gradeNumber: number;
  gradeName: string;
  tracks: DirectoryTrack<T>[];
};

const order = (value: number | null): number =>
  Number.isInteger(value) ? Number(value) : 999;

const curriculumPriority = (name: string) =>
  /الفصل الأول/u.test(name) ? 0 : /الجزء الثاني/u.test(name) ? 2 : 1;

// Fallback to the first valid label, but prefer "الصف الأول الثانوي"
// over an otherwise equivalent abbreviated "الأول الثانوي".
function preferredGradeLabel(previous: string, candidate: string): string {
  if (!previous.trim()) return candidate;
  if (!candidate.trim()) return previous;
  return candidate.startsWith("الصف ") && !previous.startsWith("الصف ")
    ? candidate : previous;
}

export function groupPublicDirectoryLessons<T extends DirectoryLesson>(
  rows: readonly T[],
): DirectoryGrade<T>[] {
  type WorkingTrack = {
    id: string;
    name: string;
    units: Map<string, DirectoryUnit<T>>;
    lessonCount: number;
  };
  type WorkingGrade = {
    gradeNumber: number;
    gradeName: string;
    tracks: Map<string, WorkingTrack>;
  };
  const grades = new Map<number, WorkingGrade>();
  for (const lesson of rows) {
    const gradeNumber = lesson.grade_number;
    if (!Number.isInteger(gradeNumber) || gradeNumber === null ||
        gradeNumber < 1 || gradeNumber > 13 ||
        !lesson.curriculum_id || !lesson.unit_id) continue;

    if (!grades.has(gradeNumber)) {
      grades.set(gradeNumber, {
        gradeNumber,
        gradeName: lesson.grade_name,
        tracks: new Map(),
      });
    }
    const grade = grades.get(gradeNumber)!;
    grade.gradeName = preferredGradeLabel(grade.gradeName, lesson.grade_name);

    if (!grade.tracks.has(lesson.curriculum_id)) {
      grade.tracks.set(lesson.curriculum_id, {
        id: lesson.curriculum_id,
        name: lesson.curriculum_name || "المسار التعليمي",
        units: new Map(),
        lessonCount: 0,
      });
    }
    const track = grade.tracks.get(lesson.curriculum_id)!;
    track.lessonCount += 1;
    if (!track.units.has(lesson.unit_id)) {
      track.units.set(lesson.unit_id, {
        id: lesson.unit_id,
        title: lesson.unit_title,
        order: order(lesson.unit_sort_order ?? lesson.unit_number),
        semester: lesson.unit_semester ?? lesson.lesson_semester,
        lessons: [],
      });
    }
    track.units.get(lesson.unit_id)!.lessons.push(lesson);
  }
  return [...grades.values()]
    .sort((a,b)=>a.gradeNumber-b.gradeNumber)
    .map(grade => ({
      gradeNumber: grade.gradeNumber,
      gradeName: grade.gradeName,
      tracks: [...grade.tracks.values()]
        .sort((a,b)=>
          curriculumPriority(a.name)-curriculumPriority(b.name) ||
          a.name.localeCompare(b.name, "ar"))
        .map(track=>({
          id:track.id,
          name:track.name,
          lessonCount:track.lessonCount,
          units:[...track.units.values()]
            .sort((a,b)=>a.order-b.order || a.title.localeCompare(b.title,"ar"))
            .map(unit=>({
              ...unit,
              lessons:unit.lessons.sort((a,b)=>
                order(a.sort_order ?? a.lesson_number)-order(b.sort_order ?? b.lesson_number)),
            })),
        })),
    }));
}
