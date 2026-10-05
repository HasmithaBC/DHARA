import type { Metadata } from "next";
import { fetchProperty } from "./api";
import { SITE_URL, propertyPath } from "./config";
import { mediaUrl } from "./media";

/** Page <title>/description/social card for a listing, using the SEO fields saved in the admin. */
export async function propertyMetadata(slug: string): Promise<Metadata> {
  const property = await fetchProperty(slug);
  if (!property) return { title: "Property Not Found" };

  const description =
    property.meta_description?.trim() ||
    property.short_description?.trim() ||
    (property.description || "").trim().slice(0, 160) ||
    undefined;
  const cover = [...(property.images ?? [])].sort((a, b) => Number(b.is_cover) - Number(a.is_cover))[0];
  const image = cover?.url ? mediaUrl(cover.url) : "";

  return {
    // A custom SEO title replaces the site template ("... | Dhara") instead of being appended to it.
    title: property.meta_title?.trim() ? { absolute: property.meta_title.trim() } : property.title,
    description,
    alternates: { canonical: `${SITE_URL}${propertyPath(property.slug)}` },
    openGraph: {
      title: property.meta_title?.trim() || property.title,
      description,
      images: image ? [image.startsWith("http") ? image : `${SITE_URL}${image}`] : undefined,
    },
  };
}
