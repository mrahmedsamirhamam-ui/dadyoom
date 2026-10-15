export const BAHRAIN_SECONDARY_TRACKS = {
  unified: "توحيد المسارات",
  engineering: "المسار الإداري والتكنولوجي - الهندسي",
  vocational: "التعليم الفني والمهني",
  religious: "التعليم الديني",
} as const;

export function secondaryTrackTitle(slug: string): string | null {
  return Object.prototype.hasOwnProperty.call(BAHRAIN_SECONDARY_TRACKS, slug)
    ? BAHRAIN_SECONDARY_TRACKS[slug as keyof typeof BAHRAIN_SECONDARY_TRACKS]
    : null;
}

export function secondaryTrackSlug(track: string | null): string | null {
  for (const [slug, title] of Object.entries(BAHRAIN_SECONDARY_TRACKS)) {
    if (track === title) return slug;
  }
  return null;
}
