import PropertyDetailView from "@/components/PropertyDetailView";

export default function Page({ params }: { params: { slug: string } }) {
  return <PropertyDetailView slug={params.slug} />;
}
