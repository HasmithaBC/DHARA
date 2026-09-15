import type { MetadataRoute } from "next";

// NFRSEO-005 / NFRSEC-008: disallow /admin and preview routes, noindex staging is handled at the host level.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin"] },
    sitemap: "https://dharact.com/sitemap.xml",
  };
}
