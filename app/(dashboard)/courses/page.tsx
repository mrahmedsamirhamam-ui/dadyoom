import CurriculumCatalogClient from "./CurriculumCatalogClient";

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