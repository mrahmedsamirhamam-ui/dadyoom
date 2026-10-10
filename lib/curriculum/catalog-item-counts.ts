/** Keep book index cards separate from genuine lesson counts. */
export function isDadyoomCoreCurriculum(name: string): boolean {
  return name.includes("المسار العربي الأساسي لضاديوم");
}

export type CatalogCountUnit = {
  curriculum: { name: string };
  lessons: readonly {
    resourceKind?: "lesson" | "book-reference";
    completed: boolean;
  }[];
};

export function countCatalogItems(units: readonly CatalogCountUnit[]) {
  let lessonCount = 0;
  let completedLessonCount = 0;
  let officialLessonCount = 0;
  let supportingLessonCount = 0;
  let bookReferenceCount = 0;

  for (const unit of units) {
    const supporting = isDadyoomCoreCurriculum(unit.curriculum.name);
    for (const lesson of unit.lessons) {
      // A verified book title or contents reference is not an individual lesson.
      if (lesson.resourceKind === "book-reference") {
        bookReferenceCount += 1;
        continue;
      }
      lessonCount += 1;
      if (lesson.completed) completedLessonCount += 1;
      if (supporting) supportingLessonCount += 1;
      else officialLessonCount += 1;
    }
  }
  return {
    lessonCount,
    completedLessonCount,
    officialLessonCount,
    supportingLessonCount,
    bookReferenceCount,
  };
}
