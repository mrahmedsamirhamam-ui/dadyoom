
export const SITE_NAME = "ضاديوم";
export const SITE_NAME_LATIN = "Dadyoom";
export const SITE_NAME_ARABIC_ALT = "ضاضيوم";
export const SITE_NAME_ARABIC_VARIANTS = ["داديوم", "ضاديو", "داديوم التعليمية"] as const;
export const SITE_TAGLINE = "بيت العربية الرقمي";
export const SITE_DESCRIPTION =
  "ضاديوم (Dadyoom)، ويُكتب أحيانًا في البحث «ضاضيوم»، منصة عربية ذكية متكاملة لتعلّم اللغة العربية عبر المناهج والدروس والمهارات الأربع وقاموس السياق والرفيق التعليمي ضاد.";

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
