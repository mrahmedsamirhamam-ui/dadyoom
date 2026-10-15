export const continuingLevels = {
  "literacy-1": "الأول محو الأمية",
  "literacy-2": "الثاني محو الأمية",
  "followup-1": "الأول متابعة",
  "followup-2": "الثاني متابعة",
  "strengthening-1": "الأول تقوية",
  "strengthening-2": "الثاني تقوية",
} as const;
export function continuingLevel(slug: string): string | null {
  return Object.hasOwn(continuingLevels, slug)
    ? continuingLevels[slug as keyof typeof continuingLevels] : null;
}
export function continuingSlug(level: string | null | undefined): string | null {
  return Object.entries(continuingLevels).find(([, name]) => name === level)?.[0] ?? null;
}
