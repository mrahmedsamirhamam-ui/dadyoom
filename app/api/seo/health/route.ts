import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = getSiteUrl();

  return NextResponse.json({
    ok: true,
    siteUrl,
    robotsUrl:
      `${siteUrl}/robots.txt`,
    sitemapUrl:
      `${siteUrl}/sitemap.xml`,
    googleVerificationConfigured:
      Boolean(
        process.env.GOOGLE_SITE_VERIFICATION?.trim(),
      ),
    bingVerificationConfigured:
      Boolean(
        process.env.BING_SITE_VERIFICATION?.trim(),
      ),
    dynamicLessonSitemapConfigured:
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      ),
  });
}
