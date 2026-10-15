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
    // Submit one authoritative, complete sitemap. The older brand-only XML
    // is retained for previous links but is no longer a second submission.
    sitemap: [`${base}/sitemap.xml`],
    host: base,
  };
}
