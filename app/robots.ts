import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/teachers",
        "/courses",
        "/curriculum",
        "/pricing",
        "/privacy",
        "/terms",
        "/refund-policy",
        "/marketplace",
        "/lessons/",
      ],
      disallow: [
        "/api/",
        "/student/",
        "/child/",
        "/teacher/",
        "/parent/",
        "/school/",
        "/admin/",
        "/profile/",
        "/payments/",
        "/onboarding/",
        "/rewards",
        "/skills",
        "/dictionary",
        "/reading-challenge",
        "/ask",
        "/login",
        "/signup",
      ],
    },
    sitemap: [`${base}/sitemap.xml`, `${base}/sitemap-brand.xml`],
    host: base,
  };
}
