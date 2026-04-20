import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteOrigin = getSiteOrigin();
  const configuredAdminSlug = process.env.ADMIN_ROUTE_SLUG?.trim();
  const disallow: string[] = ["/api/admin/"];

  if (configuredAdminSlug) {
    disallow.push(`/${configuredAdminSlug}`);
    disallow.push(`/${configuredAdminSlug}/dashboard`);
    disallow.push(`/${configuredAdminSlug}/dashboard/`);
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin,
  };
}
