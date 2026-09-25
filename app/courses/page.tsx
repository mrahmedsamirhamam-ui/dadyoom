import type { Metadata } from "next";
import CurriculumCatalogClient from "./CurriculumCatalogClient";
import { getStudentCurriculumCatalog } from "@/services/lessons/student-curriculum-catalog";

export const metadata: Metadata = {
  title: "مناهج اللغة العربية | ضاديوم",
  description:
    "استكشف مسار ضاديوم العربي الأساسي للدول العربية الـ22 من الصف الأول إلى الصف الثاني عشر، مع الدروس والمهارات والتقدم.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage() {
  return <CurriculumCatalogClient units={await getStudentCurriculumCatalog()} />;
}
