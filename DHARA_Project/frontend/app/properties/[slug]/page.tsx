import PropertyDetailView from "@/components/PropertyDetailView";
import { propertyMetadata } from "@/lib/property-metadata";

// Always rendered live: whatever is saved in the admin shows on the next page load.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return propertyMetadata(slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PropertyDetailView slug={slug} />;
}
