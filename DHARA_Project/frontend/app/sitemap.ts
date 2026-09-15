import type { MetadataRoute } from "next";
import { fetchProjects, fetchProperties, fetchServices } from "@/lib/api";

// NFRSEO-005: auto-generated sitemap including all published listings.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://dharact.com";
  const staticRoutes = [
    "", "/properties", "/properties/lands", "/properties/houses", "/properties/houses/rent",
    "/properties/commercial/rent", "/properties/other", "/services", "/projects",
    "/about-us", "/contact", "/privacy-policy", "/terms",
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  const categoryPath: Record<string, string> = { LAND: "lands", HOUSE: "houses", COMMERCIAL: "commercial" };
  const { data: properties } = await fetchProperties({ per_page: "50" });
  const propertyRoutes = properties.map((p) => ({
    url: `${base}/properties/${categoryPath[p.category] ?? "other"}/${p.slug}`,
    lastModified: new Date(),
  }));

  const services = await fetchServices();
  const serviceRoutes = services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: new Date() }));

  const projects = await fetchProjects();
  const projectRoutes = projects.map((p) => ({ url: `${base}/projects/${p.slug}`, lastModified: new Date() }));

  return [...staticRoutes, ...propertyRoutes, ...serviceRoutes, ...projectRoutes];
}
