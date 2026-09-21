import PropertyCatalogue from "@/components/PropertyCatalogue";

export const metadata = { title: "All Properties" };

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  return <PropertyCatalogue title="Properties" searchParams={searchParams} />;
}
