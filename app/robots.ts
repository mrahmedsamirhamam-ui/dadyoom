import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
    "http://localhost:3000";

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
