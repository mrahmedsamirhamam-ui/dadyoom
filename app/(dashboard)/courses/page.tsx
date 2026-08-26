import type { Metadata } from "next";
import CurriculumCatalogClient from "./CurriculumCatalogClient";

export const metadata: Metadata = {
  title: "المناهج والدروس",
  description: "تصفح المناهج العربية والدروس المنشورة في ضاديوم بصورة منظمة حسب الدولة والمرحلة والصف والوحدة.",
  alternates: { canonical: "/courses" },
};

import {
  getPublishedUnits,
} from "@/services/lessons/catalog";

export default async function CoursesPage() {
  const units =
    await getPublishedUnits();

  return (
    <CurriculumCatalogClient
      units={units}
    />
  );
}
