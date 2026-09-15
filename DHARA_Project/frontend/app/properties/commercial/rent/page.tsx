import PropertyCatalogue from "@/components/PropertyCatalogue";

export const metadata = { title: "Commercial for Rent" };

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <PropertyCatalogue title="Commercial for Rent" searchParams={searchParams} forced={{ category: "COMMERCIAL", type: "RENT" }} />;
}
