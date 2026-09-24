export const SITE_NAME = "ضاديوم";
export const SITE_NAME_LATIN = "Dadyoom";
export const SITE_TAGLINE = "بيت العربية الرقمي";
export const SITE_DESCRIPTION =
  "ضاديوم (Dadyoom) منصة عربية ذكية متكاملة لتعلّم اللغة العربية عبر المناهج والدروس والمهارات الأربع وقاموس السياق والرفيق التعليمي ضاد.";

export const PRODUCTION_FALLBACK_SITE_URL =
  "https://dadyoom.mrahmedsamirhamam.workers.dev";

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
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.DADYOOM_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_URL) ??
    PRODUCTION_FALLBACK_SITE_URL
  );
}
