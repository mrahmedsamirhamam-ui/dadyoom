import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Keep robots sitemap URL consistent with metadata and /sitemap.xml.
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
      ],
      disallow: [
        "/api/",
        "/student/",
        "/teacher/",
        "/school/",
        "/admin/",
        "/profile/",
        "/payments/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
