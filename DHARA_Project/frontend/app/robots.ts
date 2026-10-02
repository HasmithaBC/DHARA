import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

// NFRSEO-005 / NFRSEC-008: disallow /admin and preview routes, noindex staging is handled at the host level.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
