import PropertyCatalogue from "@/components/PropertyCatalogue";

export const metadata = { title: "Houses for Sale" };

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <PropertyCatalogue title="Houses for Sale" searchParams={searchParams} forced={{ category: "HOUSE", type: "SALE" }} />;
}
