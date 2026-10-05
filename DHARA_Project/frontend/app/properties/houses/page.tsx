import PropertyCatalogue from "@/components/PropertyCatalogue";

// Always rendered live so admin changes show immediately.
export const dynamic = "force-dynamic";

export const metadata = { title: "Houses for Sale" };

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  return <PropertyCatalogue title="Houses for Sale" searchParams={searchParams} forced={{ category: "HOUSE", type: "SALE" }} />;
}
