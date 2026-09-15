import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProjects, fetchService } from "@/lib/api";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";

// Per-service supplementary image galleries mapped to available assets
const SERVICE_GALLERY: Record<string, string[]> = {
  "civil-construction": [
    "/images/services/consulting1.webp",
    "/images/services/consulting2.webp",
    "/images/services/consulting3.webp",
    "/images/services/buildingPlan.webp",
  ],
  "tower-foundations": [
    "/images/services/RoadSafety.webp",
    "/images/services/geosyntheticalSol (1).webp",
  ],
  "architectural-design": [
    "/images/services/ArchitecturalDesign.webp",
    "/images/services/buildingPlan.webp",
  ],
  "mep": [
    "/images/services/homenetworking.webp",
    "/images/services/homenetworking2.webp",
    "/images/services/AirConditioning.webp",
  ],
  "interiors": [
    "/images/services/flooring.webp",
    "/images/services/protectiveCoating.webp",
    "/images/services/S1.png",
    "/images/services/S2.png",
  ],
  "boq-estimation": [
    "/images/services/BOQ.webp",
    "/images/services/Estimating.webp",
  ],
  "3d-visualization": [
    "/images/services/3Ddesign.webp",
  ],
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const service = await fetchService(params.slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
  };
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await fetchService(params.slug);
  if (!service) notFound();
  const relatedProjects = await fetchProjects();
  const gallery = SERVICE_GALLERY[params.slug] ?? [];

  // Parse body into paragraphs and bullet list
  const bodyText = service.body ?? service.summary;
  const sections = bodyText.split("\n\n");

  return (
    <div>
      {/* Hero */}
      <div className="relative aspect-[21/8] w-full overflow-hidden bg-stone-fog">
        <Image src={service.hero_image} alt={service.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-concrete-900/50" />
        <div className="container-content absolute inset-0 flex flex-col justify-end pb-10">
          <p className="eyebrow fade-in-up fade-in-up-1 text-brass-light">Services</p>
          <h1 className="fade-in-up fade-in-up-2 mt-3 font-display text-3xl text-stone-paper md:text-4xl">
            {service.title}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="container-content grid gap-10 py-14 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-base leading-relaxed text-ink-soft">{service.summary}</p>

          {sections.length > 0 && (
            <div className="mt-6 space-y-4">
              {sections.map((section, i) => {
                // Check if section is a bullet list block
                if (section.trim().startsWith("•") || section.trim().startsWith("Key capabilities:")) {
                  const lines = section.split("\n");
                  const heading = lines[0].startsWith("Key") ? lines[0] : null;
                  const bullets = lines.filter((l) => l.trim().startsWith("•"));
                  return (
                    <div key={i} className="mt-6 border-l-2 border-brass pl-5">
                      {heading && (
                        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink">{heading}</div>
                      )}
                      <ul className="space-y-1.5">
                        {bullets.map((b, j) => (
                          <li key={j} className="text-sm text-ink-soft">
                            {b.replace("• ", "")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-sm leading-relaxed text-ink-soft">
                    {section.trim()}
                  </p>
                );
              })}
            </div>
          )}

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="mt-10">
              <p className="eyebrow mb-4">Gallery</p>
              <StaggerGroup className={`grid gap-4 ${gallery.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
                {gallery.map((img, i) => (
                  <StaggerItem key={i}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
                      <Image
                        src={img}
                        alt={`${service.title} — image ${i + 1}`}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <aside className="h-fit border border-stone-line bg-stone-paper p-6">
            <h3 className="font-display text-lg text-ink">Discuss your project</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Tell us what you're planning and we'll get back to you within one business day.
            </p>
            <Link href={`/contact?service=${service.slug}`} className="btn-brass mt-4 inline-flex transition-transform hover:-translate-y-0.5">
              Request a Consultation
            </Link>
          </aside>

          <aside className="border border-stone-line bg-stone-paper p-6">
            <h3 className="font-display text-base text-ink">Other Services</h3>
            <ul className="mt-3 space-y-2">
              {[
                { slug: "civil-construction", label: "Civil Construction" },
                { slug: "tower-foundations", label: "Tower Foundations" },
                { slug: "architectural-design", label: "Architectural Design" },
                { slug: "mep", label: "MEP Systems" },
                { slug: "interiors", label: "Interiors & Fit-Outs" },
                { slug: "boq-estimation", label: "BOQ & Cost Auditing" },
                { slug: "3d-visualization", label: "3D Visualisation" },
              ]
                .filter((s) => s.slug !== params.slug)
                .map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="text-sm text-ink underline decoration-stone-line underline-offset-4 transition-colors hover:text-brass-dark hover:decoration-brass"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </aside>

          <aside className="border border-stone-line bg-concrete-900 p-6 text-stone-paper">
            <h3 className="font-display text-base">Contact Us Directly</h3>
            <p className="mt-2 text-xs text-stone-line">Monday – Saturday, 8:30am – 5:30pm</p>
            <a href="tel:+94763774551" className="mt-3 block text-sm font-semibold text-brass-light hover:text-brass">
              +94 76 377 4551
            </a>
            <a href="mailto:kosala@dharact.com" className="mt-1 block text-sm text-stone-line hover:text-brass-light">
              kosala@dharact.com
            </a>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94763774551"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brass mt-4 inline-flex w-full justify-center"
            >
              WhatsApp
            </a>
          </aside>
        </div>
      </div>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <div className="border-t border-stone-line bg-stone-paper py-14">
          <div className="container-content">
            <Reveal>
              <p className="eyebrow">Portfolio</p>
              <h2 className="mt-2 font-display text-2xl text-ink">Related Projects</h2>
            </Reveal>
            <StaggerGroup className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.slice(0, 3).map((p) => (
                <StaggerItem key={p.id}>
                  <Link href={`/projects/${p.slug}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
                      <Image
                        src={p.cover_image}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-display text-base text-ink transition-colors group-hover:text-brass-dark">{p.title}</span>
                      <span className="text-xs text-ink-soft">{p.location}, {p.year_completed}</span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
            <div className="mt-8">
              <Link href="/projects" className="btn-outline inline-flex transition-transform hover:-translate-y-0.5">
                View All Projects
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
