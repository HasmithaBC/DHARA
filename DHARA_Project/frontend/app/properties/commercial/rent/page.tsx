import PropertyCatalogue from "@/components/PropertyCatalogue";

// Always rendered live so admin changes show immediately.
export const dynamic = "force-dynamic";

export const metadata = { title: "Commercial for Rent" };

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  return <PropertyCatalogue title="Commercial for Rent" searchParams={searchParams} forced={{ category: "COMMERCIAL", type: "RENT" }} />;
}
