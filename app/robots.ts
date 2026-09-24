import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/courses",
        "/pricing",
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
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
