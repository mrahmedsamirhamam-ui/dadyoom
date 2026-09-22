import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/site";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = getSiteUrl();

  return NextResponse.json({
    ok: true,
    siteUrl,
    robotsUrl: `${siteUrl}/robots.txt`,
    sitemapUrl: `${siteUrl}/sitemap.xml`,
    googleVerificationConfigured:
      Boolean(process.env.GOOGLE_SITE_VERIFICATION?.trim()),
    bingVerificationConfigured:
      Boolean(process.env.BING_SITE_VERIFICATION?.trim()),
    dynamicLessonSitemapConfigured:
      Boolean(SUPABASE_PUBLIC_URL && SUPABASE_PUBLIC_KEY),
    sitemapDataAccess: "public-published-rows",
  });
}
