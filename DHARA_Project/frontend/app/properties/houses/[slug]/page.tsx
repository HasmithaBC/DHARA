import PropertyDetailView from "@/components/PropertyDetailView";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PropertyDetailView slug={slug} />;
}
