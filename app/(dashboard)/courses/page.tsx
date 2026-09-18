import CurriculumCatalogClient from "./CurriculumCatalogClient";
import { getStudentCurriculumCatalog } from "@/services/lessons/student-curriculum-catalog";

export default async function CoursesPage() {
  return <CurriculumCatalogClient units={await getStudentCurriculumCatalog()} />;
}
