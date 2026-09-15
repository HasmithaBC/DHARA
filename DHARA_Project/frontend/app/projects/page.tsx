import Image from "next/image";
import Link from "next/link";
import { fetchProjects } from "@/lib/api";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";

export const metadata = { title: "Projects" };

const sectors = ["Residential", "Commercial", "Industrial", "Hospitality", "Infrastructure"];

export default async function ProjectsPage({ searchParams }: { searchParams: { sector?: string } }) {
  const projects = await fetchProjects(searchParams.sector);

  return (
    <div>
      {/* Hero */}
      <div className="relative aspect-[21/8] w-full overflow-hidden bg-concrete-900">
        <Image src="/images/projects/imagebanner.webp" alt="Dhara Construction Projects" fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-concrete-900/80 via-concrete-900/40 to-concrete-900/20" />
        <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-content absolute inset-0 flex flex-col justify-end pb-10">
          <p className="eyebrow fade-in-up fade-in-up-1 text-brass-light">Portfolio</p>
          <h1 className="fade-in-up fade-in-up-2 mt-2 font-display text-3xl text-stone-paper md:text-4xl">Projects</h1>
          <p className="fade-in-up fade-in-up-3 mt-3 max-w-xl text-sm text-stone-line">
            A cross-section of civil, MEP and residential work delivered end-to-end by Dhara's in-house teams.
          </p>
        </div>
      </div>

      <div className="container-content py-14">
        <Reveal className="flex flex-wrap gap-2">
          <Link
            href="/projects"
            className={`border px-4 py-1.5 text-xs font-medium transition-colors ${
              !searchParams.sector ? "border-ink bg-ink text-stone-paper" : "border-stone-line text-ink-soft hover:border-brass hover:text-brass-dark"
            }`}
          >
            All
          </Link>
          {sectors.map((s) => (
            <Link
              key={s}
              href={`/projects?sector=${s}`}
              className={`border px-4 py-1.5 text-xs font-medium transition-colors ${
                searchParams.sector === s ? "border-ink bg-ink text-stone-paper" : "border-stone-line text-ink-soft hover:border-brass hover:text-brass-dark"
              }`}
            >
              {s}
            </Link>
          ))}
        </Reveal>

        {projects.length === 0 ? (
          <p className="mt-14 text-center text-sm text-ink-soft">No projects found for this sector yet — check back soon.</p>
        ) : (
          <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <StaggerItem key={p.id}>
                <Link href={`/projects/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
                    <Image
                      src={p.cover_image}
                      alt={p.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-concrete-900/60 via-concrete-900/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="absolute left-3 top-3 -translate-y-2 bg-brass px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {p.sector}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display text-base text-ink transition-colors group-hover:text-brass-dark">{p.title}</span>
                    <span className="text-xs text-ink-soft">{p.location}, {p.year_completed}</span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </div>
  );
}
