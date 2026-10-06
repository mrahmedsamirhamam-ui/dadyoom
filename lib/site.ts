export const SITE_NAME = "ضاديوم";
export const SITE_NAME_LATIN = "Dadyoom";
export const SITE_NAME_ARABIC_ALT = "ضاضيوم";
export const SITE_NAME_ARABIC_ALT_DADYOOM = "داديوم";
export const SITE_TAGLINE = "بيت العربية الرقمي";
export const SITE_DESCRIPTION =
  "ضاديوم (Dadyoom)، ويُكتب أحيانًا في البحث «ضاضيوم» أو «داديوم»، منصة عربية ذكية متكاملة لتعلّم اللغة العربية عبر المناهج والدروس والمهارات الأربع وقاموس السياق والرفيق التعليمي ضاد.";

export const PRODUCTION_FALLBACK_SITE_URL =
  "https://dadyoom.dpdns.org";

const LEGACY_SITE_HOSTS = new Set([
  "dadyoom.pages.dev",
  "dadyoom.mrahmedsamirhamam.workers.dev",
]);

function normalizeOrigin(value: string | undefined): string | null {
  const clean = value?.trim();

  if (!clean) {
    return null;
  }

  const withProtocol = /^https?:\/\//iu.test(clean)
    ? clean
    : `https://${clean}`;

  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const candidates = [
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    normalizeOrigin(process.env.DADYOOM_PRODUCTION_URL),
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    normalizeOrigin(process.env.VERCEL_URL),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const hostname =
        new URL(candidate).hostname.toLowerCase();

      if (LEGACY_SITE_HOSTS.has(hostname)) {
        continue;
      }

      return candidate;
    } catch {
      continue;
    }
  }

  return PRODUCTION_FALLBACK_SITE_URL;
}
