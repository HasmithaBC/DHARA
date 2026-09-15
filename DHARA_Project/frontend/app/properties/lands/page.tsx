import PropertyCatalogue from "@/components/PropertyCatalogue";

export const metadata = { title: "Land for Sale" };

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <PropertyCatalogue title="Land for Sale" searchParams={searchParams} forced={{ category: "LAND", type: "SALE" }} />;
}
