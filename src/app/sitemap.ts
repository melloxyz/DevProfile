import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteOrigin = getSiteOrigin();

  return [
    {
      url: `${siteOrigin}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
