import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/site";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_VERIFICATION_FILE =
  "/google4170b7663eaee81a.html";

export async function GET() {
  const siteUrl = getSiteUrl();
  const googleMetaConfigured =
    Boolean(process.env.GOOGLE_SITE_VERIFICATION?.trim());

  return NextResponse.json({
    ok: true,
    siteUrl,
    robotsUrl: `${siteUrl}/robots.txt`,
    sitemapUrl: `${siteUrl}/sitemap.xml`,
    googleVerificationConfigured: true,
    googleVerificationMethod:
      googleMetaConfigured ? "meta" : "static-file",
    googleVerificationUrl:
      `${siteUrl}${GOOGLE_VERIFICATION_FILE}`,
    bingVerificationConfigured:
      Boolean(process.env.BING_SITE_VERIFICATION?.trim()),
    dynamicLessonSitemapConfigured:
      Boolean(SUPABASE_PUBLIC_URL && SUPABASE_PUBLIC_KEY),
    sitemapDataAccess: "public-published-rows",
  });
}
