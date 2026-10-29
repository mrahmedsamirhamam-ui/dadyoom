
export const SITE_NAME = "ضاديوم";
export const SITE_NAME_LATIN = "Dadyoom";
export const SITE_NAME_ARABIC_ALT = "ضاضيوم";
/**
 * A compact, human-recognizable set of common search variants, not
 * dynamically generated misspellings or separate keyword-targeted pages.
 * Priority order: English brand, common Arabic misspellings, Latin variation,
 * and the official domain as the last fallback for Google's site-name system.
 */
export const SITE_NAME_ALTERNATES = [
  "Dadyoom",
  "ضاضيوم",
  "داديوم",
  "ضاديو",
  "Dadyoum",
  "dadyoom.com",
] as const;
export const SITE_NAME_ARABIC_VARIANTS = ["ضاضيوم", "داديوم", "ضاديو"] as const;
export const SITE_TAGLINE = "بيت العربية الرقمي";
export const SITE_DESCRIPTION =
  "ضاديوم (Dadyoom) — بيت العربية الرقمي، منصة لتعلّم اللغة العربية بالمناهج والدروس والأنشطة والمهارات الأربع؛ قد تُكتب في البحث ضاضيوم أو داديوم أو Dadyoum.";

function normalizeOrigin(value: string | undefined): string | null {
  const clean = value?.trim();
  if (!clean) return null;

  const withProtocol = /^https?:\/\//i.test(clean)
    ? clean
    : `https://${clean}`;

  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * All public production SEO signals must use the one canonical hostname.
 * Preview deployments may serve requests on another domain, but must not
 * publish localhost or preview hosts as canonical URLs / sitemap entries.
 */
export function getSiteUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return "https://dadyoom.com";
  }

  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    "http://localhost:3000"
  );
}
