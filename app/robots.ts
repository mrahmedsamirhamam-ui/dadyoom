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
        "/skills",
        "/dictionary",
        "/pricing",
        "/marketplace",
        "/lessons/",
        "/reading-challenge",
        "/ask",
      ],
      disallow: [
        "/api/",
        "/student/",
        "/teacher/",
        "/parent/",
        "/school/",
        "/admin/",
        "/profile/",
        "/payments/",
        "/onboarding/",
        "/rewards",
        "/login",
        "/signup",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
