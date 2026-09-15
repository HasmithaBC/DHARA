import PropertyCatalogue from "@/components/PropertyCatalogue";

export const metadata = { title: "Houses for Rent" };

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <PropertyCatalogue title="Houses for Rent" searchParams={searchParams} forced={{ category: "HOUSE", type: "RENT" }} />;
}
