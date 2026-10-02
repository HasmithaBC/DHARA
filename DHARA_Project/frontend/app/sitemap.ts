import type { MetadataRoute } from "next";
import { fetchProjects, fetchProperties, fetchServices } from "@/lib/api";

export const dynamic = "force-dynamic";

// NFRSEO-005: auto-generated sitemap including all published listings.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://dharact.com").replace(/\/+$/, "");
  const staticRoutes = [
    "", "/properties", "/properties/lands", "/properties/houses", "/properties/houses/rent",
    "/properties/commercial/rent", "/properties/other", "/services", "/projects",
    "/about-us", "/contact", "/privacy-policy", "/terms",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  const categoryPath: Record<string, string> = { LAND: "lands", HOUSE: "houses", COMMERCIAL: "commercial" };
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const [props, services, projects] = await Promise.all([
      fetchProperties({ per_page: "100" }),
      fetchServices(),
      fetchProjects(),
    ]);
    dynamicRoutes = [
      ...props.data.map((p) => ({
        url: `${base}/properties/${categoryPath[p.category] ?? "other"}/${p.slug}`,
        lastModified: new Date(),
      })),
      ...services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: new Date() })),
      ...projects.map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: new Date() })),
    ];
  } catch {
    // API unreachable: still serve the static routes rather than failing the sitemap.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
