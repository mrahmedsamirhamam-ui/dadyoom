export type UserRole =
  | "student"
  | "teacher"
  | "parent"
  | "school"
  | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  grade?: string;
  school?: string;
  country?: string;
}