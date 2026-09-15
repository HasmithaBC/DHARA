import PropertyCatalogue from "@/components/PropertyCatalogue";

export const metadata = { title: "Commercial & Other for Sale" };

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <PropertyCatalogue title="Commercial & Other for Sale" searchParams={searchParams} forced={{ category: "COMMERCIAL", type: "SALE" }} />;
}
