export type UserRole =
  | "student"
  | "teacher"
  | "parent"
  | "school"
  | "admin";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  country: string;
}
