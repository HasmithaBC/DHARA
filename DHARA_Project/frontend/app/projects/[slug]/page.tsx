import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProject, fetchProjects } from "@/lib/api";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import SmartMedia, { isVideoUrl } from "@/components/SmartMedia";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await fetchProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description ?? `${project.title} — a Dhara Construction project in ${project.location}.`,
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, allProjects] = await Promise.all([
    fetchProject(slug),
    fetchProjects(),
  ]);
  if (!project) notFound();

  const otherProjects = allProjects.filter((p) => p.slug !== slug).slice(0, 3);
  const gallery: string[] = project.gallery_images ?? [];

  return (
    <div>
      {/* Hero */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-stone-fog">
        <SmartMedia
          src={project.cover_image}
          alt={project.title}
          priority
          className={isVideoUrl(project.cover_image) ? "" : "animate-kenburns object-cover motion-reduce:animate-none"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-concrete-900/70 via-concrete-900/30 to-transparent" />
        <div className="container-content absolute inset-0 flex flex-col justify-end pb-10">
          <p className="eyebrow fade-in-up fade-in-up-1 text-brass-light">
            {project.sector} · {project.location} · {project.year_completed}
          </p>
          <h1 className="fade-in-up fade-in-up-2 mt-2 font-display text-3xl text-stone-paper md:text-4xl">
            {project.title}
          </h1>
        </div>
      </div>

      {/* Content + sidebar */}
      <div className="container-content grid gap-10 py-14 lg:grid-cols-[1fr_280px]">
        <div>
          {project.description && (
            <Reveal>
              <p className="eyebrow">Project Overview</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{project.description}</p>
            </Reveal>
          )}
          {project.scope && (
            <Reveal delay={0.1}>
              <h2 className="mt-8 font-display text-lg text-ink">Scope of Works</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{project.scope}</p>
            </Reveal>
          )}
          {project.body && (
            <Reveal delay={0.15}>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{project.body}</p>
            </Reveal>
          )}

          {/* Gallery */}
          {gallery.length > 1 && (
            <div className="mt-10">
              <Reveal>
                <p className="eyebrow mb-4">Project Gallery</p>
              </Reveal>
              <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((img, i) => (
                  <StaggerItem key={i}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
                      <SmartMedia
                        src={img}
                        alt={`${project.title} — ${isVideoUrl(img) ? "clip" : "photo"} ${i + 1}`}
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
        <div className="space-y-5">
          <aside className="border border-stone-line bg-stone-paper p-5 text-sm">
            <p className="eyebrow mb-4">Project Details</p>
            <dl className="space-y-3">
              {project.client_name && (
                <div>
                  <dt className="text-xs text-ink-soft">Client</dt>
                  <dd className="mt-0.5 text-ink">{project.client_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-ink-soft">Sector</dt>
                <dd className="mt-0.5 text-ink">{project.sector}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Location</dt>
                <dd className="mt-0.5 text-ink">{project.location}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Year Completed</dt>
                <dd className="mt-0.5 text-ink">{project.year_completed}</dd>
              </div>
            </dl>
          </aside>

          <aside className="border border-stone-line bg-concrete-900 p-5 text-stone-paper">
            <h3 className="font-display text-base">Start a Similar Project</h3>
            <p className="mt-2 text-xs text-stone-line">
              Talk to our team about your requirements and get a no-obligation consultation.
            </p>
            <Link href="/contact" className="btn-brass mt-4 inline-flex w-full justify-center transition-transform hover:-translate-y-0.5">
              Contact Us
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94763774551"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-xs text-stone-line underline underline-offset-4 hover:text-brass-light"
            >
              or chat on WhatsApp
            </a>
          </aside>
        </div>
      </div>

      {/* More Projects */}
      {otherProjects.length > 0 && (
        <section className="border-t border-stone-line bg-stone-paper py-14">
          <div className="container-content">
            <Reveal className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Portfolio</p>
                <h2 className="mt-2 font-display text-2xl text-ink">More Projects</h2>
              </div>
              <Link href="/projects" className="hidden text-sm underline decoration-brass underline-offset-4 hover:text-brass-dark sm:inline">
                View all
              </Link>
            </Reveal>
            <StaggerGroup className="mt-8 grid gap-6 sm:grid-cols-3">
              {otherProjects.map((p) => (
                <StaggerItem key={p.id}>
                  <Link href={`/projects/${p.slug}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
                      <Image
                        src={p.cover_image}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display text-sm text-ink transition-colors group-hover:text-brass-dark">{p.title}</span>
                      <span className="text-xs text-ink-soft">{p.year_completed}</span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}
    </div>
  );
}
