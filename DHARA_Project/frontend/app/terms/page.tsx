import { fetchPage } from "@/lib/api";
import RichText from "@/components/RichText";

export async function generateMetadata() {
  const page = await fetchPage("terms");
  return { title: page?.meta_title || page?.title || "Terms & Conditions", description: page?.meta_description || undefined };
}

export default async function Page() {
  // Edited in Admin → Pages. Falls back to a notice until the copy has been saved once.
  const page = await fetchPage("terms");
  return (
    <div className="container-content max-w-3xl py-14">
      <h1 className="font-display text-3xl text-ink">{page?.title || "Terms & Conditions"}</h1>
      {page?.body ? (
        <RichText text={page.body} className="mt-6" />
      ) : (
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          Our terms &amp; conditions are being finalised and will be published here shortly.
        </p>
      )}
    </div>
  );
}
