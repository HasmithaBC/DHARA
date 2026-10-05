import { getContact } from "@/lib/contact";
import SmartMedia from "@/components/SmartMedia";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProjects, fetchService, fetchServices } from "@/lib/api";
import Reveal from "@/components/motion/Reveal";
import Carousel from "@/components/Carousel";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await fetchService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
  };
}

const SERVICE_TO_SECTOR: Record<string, string> = {
  "tower-foundations": "Infrastructure",
  "mep": "Industrial",
};

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const contact = await getContact();
  const { slug } = await params;
  const [service, allServices] = await Promise.all([
    fetchService(slug),
    fetchServices(),
  ]);

  if (!service) notFound();

  const sector = SERVICE_TO_SECTOR[slug] || "Residential";
  const relatedProjects = await fetchProjects(sector);
  const otherServices = allServices.filter((s) => s.slug !== slug);

  // Parse body into paragraphs and bullet list
  const bodyText = service.body?.trim() || service.summary || "";
  const sections = bodyText.split("\n\n");

  return (
    <div>
      {/* Hero */}
      <div className="relative aspect-[21/8] w-full overflow-hidden bg-stone-fog">
        <SmartMedia src={service.hero_image} alt={service.title} className="object-cover" priority />
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

          {otherServices.length > 0 && (
            <aside className="border border-stone-line bg-stone-paper p-6">
              <h3 className="font-display text-base text-ink">Other Services</h3>
              <ul className="mt-3 space-y-2">
                {otherServices.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="text-sm text-ink underline decoration-stone-line underline-offset-4 transition-colors hover:text-brass-dark hover:decoration-brass"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <aside className="border border-stone-line bg-concrete-900 p-6 text-stone-paper">
            <h3 className="font-display text-base">Contact Us Directly</h3>
            <p className="mt-2 text-xs text-stone-line">{contact.hours}</p>
            <a href={contact.telHref} className="mt-3 block text-sm font-semibold text-brass-light hover:text-brass">
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`} className="mt-1 block text-sm text-stone-line hover:text-brass-light">
              {contact.email}
            </a>
            <a
              href={`https://wa.me/${contact.whatsapp}`}
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
      <div className="border-t border-stone-line bg-stone-paper py-14">
        <div className="container-content">
          <Reveal>
            <p className="eyebrow">Portfolio</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Related Projects</h2>
          </Reveal>
          <div className="mt-8">
            <Carousel 
              items={relatedProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.slug}`} className="group flex flex-col h-full">
                  <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-stone-fog">
                    <SmartMedia
                      src={p.cover_image}
                      alt={p.title}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2 flex flex-1 flex-col">
                    <span className="font-display text-base text-ink transition-colors group-hover:text-brass-dark">{p.title}</span>
                    <span className="mt-auto text-xs text-ink-soft">{p.location}, {p.year_completed}</span>
                  </div>
                </Link>
              ))}
              itemsPerView={3}
              gridClassName="sm:grid-cols-2 lg:grid-cols-3"
              viewAllLink="/projects"
              viewAllText="View All Projects"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
