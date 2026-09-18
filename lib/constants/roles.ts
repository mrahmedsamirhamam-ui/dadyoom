export const ROLES = {
  STUDENT: "student",
  CHILD: "child",
  TEACHER: "teacher",
  PARENT: "parent",
  SCHOOL: "school",
  ADMIN: "admin",
} as const;

export type UserRole =
  (typeof ROLES)[keyof typeof ROLES];
