import PropertyCatalogue from "@/components/PropertyCatalogue";

export const metadata = { title: "All Properties" };

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <PropertyCatalogue title="All Properties" searchParams={searchParams} />;
}
