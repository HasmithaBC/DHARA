import Link from "next/link";
import Image from "next/image";
import { fetchProjects, fetchProperties, fetchServices, fetchTestimonials } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import Carousel from "@/components/Carousel";
import VideoHighlight from "@/components/VideoHighlight";
import {
  IconBlueprint,
  IconBuilding,
  IconCheckShield,
  IconCrane,
  IconHardHat,
  IconQuote,
  IconStar,
} from "@/components/icons";

const STAT_ICONS = [IconHardHat, IconBuilding, IconCheckShield, IconCrane];

const WHY_DHARA_ICONS = [IconHardHat, IconBlueprint, IconCheckShield];

export default async function HomePage() {
  const [featured, services, projects, testimonials] = await Promise.all([
    fetchProperties({ featured: "true", per_page: "12" }),
    fetchServices(),
    fetchProjects(),
    fetchTestimonials(),
  ]);

  const stats = [
    { label: "Years of Experience", value: "15+" },
    { label: "Completed Projects", value: "120+" },
    { label: "Trusted Clients", value: "300+" },
    { label: "Properties Available", value: String(featured.meta?.total ?? featured.data.length) },
  ];

  return (
    <div>
      {/* Hero — FR-HOM-001/002 */}
      <section className="relative overflow-hidden border-b border-stone-line">
        <div className="absolute inset-0">
          <Image
            src="/images/home/HeroBanner.webp"
            alt=""
            fill
            priority
            className="animate-kenburns object-cover motion-reduce:animate-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-concrete-900/85 via-concrete-900/50 to-concrete-900/10" />
          <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-30" />
        </div>

        {/* Floating decorative badge — a small construction-site charm touch */}
        <div className="pointer-events-none absolute right-10 top-24 hidden animate-float lg:block">
          <div className="flex items-center gap-2 border border-white/15 bg-white/5 px-4 py-2 text-xs text-stone-paper backdrop-blur-sm">
            <IconCheckShield className="h-4 w-4 text-brass-light" />
            Dhara-built. Dhara-owned.
          </div>
        </div>

        <div className="container-content relative py-28 md:py-36">
          <p className="eyebrow fade-in-up fade-in-up-1 text-brass-light">Dhara Construction and Technology</p>
          <h1 className="fade-in-up fade-in-up-2 mt-4 max-w-2xl font-display text-4xl leading-tight text-stone-paper md:text-5xl">
            Concepts Into Creation
          </h1>
          <p className="fade-in-up fade-in-up-3 mt-5 max-w-lg text-stone-line">
            Civil engineering, architecture and construction delivery, alongside land, house
            and commercial listings developed and marketed directly by Dhara.
          </p>
          <div className="fade-in-up fade-in-up-3 mt-8 flex flex-wrap gap-4">
            <Link href="/properties" className="btn-brass transition-transform hover:-translate-y-0.5 hover:shadow-lg">
              Explore Properties
            </Link>
            <Link
              href="/projects"
              className="btn-outline border-stone-paper text-stone-paper transition-transform hover:-translate-y-0.5 hover:bg-stone-paper hover:text-ink hover:shadow-lg"
            >
              View Portfolio
            </Link>
          </div>

          {/* Quick search — FR-HOM-002 */}
          <form
            action="/properties"
            className="fade-in-up fade-in-up-4 mt-12 grid max-w-3xl gap-3 border-t-2 border-brass bg-stone-paper p-4 shadow-2xl sm:grid-cols-4"
          >
            <select name="type" className="border border-stone-line bg-stone-paper px-3 py-2.5 text-sm text-ink transition-colors focus:border-brass focus:outline-none">
              <option value="">Buy or Rent</option>
              <option value="SALE">Buy</option>
              <option value="RENT">Rent</option>
            </select>
            <select name="category" className="border border-stone-line bg-stone-paper px-3 py-2.5 text-sm text-ink transition-colors focus:border-brass focus:outline-none">
              <option value="">Category</option>
              <option value="LAND">Land</option>
              <option value="HOUSE">House</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
            <input
              name="district"
              placeholder="District"
              className="border border-stone-line bg-stone-paper px-3 py-2.5 text-sm text-ink transition-colors focus:border-brass focus:outline-none"
            />
            <button type="submit" className="btn-primary justify-center transition-transform hover:-translate-y-0.5">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Stats — FR-HOM-003 */}
      <section className="relative overflow-hidden bg-stone-paper">
        <StaggerGroup className="container-content grid grid-cols-2 gap-5 py-14 md:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = STAT_ICONS[i % STAT_ICONS.length];
            return (
              <StaggerItem key={s.label}>
                <div className="card-elevated flex h-full flex-col items-center gap-2 p-6 text-center">
                  <Icon className="h-6 w-6 text-brass-dark" />
                  <div className="font-display text-3xl text-ink">
                    <Counter value={s.value} />
                  </div>
                  <div className="text-sm text-ink-soft">{s.label}</div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Featured properties — FR-HOM-004 */}
      <section className="container-content py-14">
        <Reveal className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Featured Listings</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Properties Available Now</h2>
          </div>
        </Reveal>
        <div className="mt-8">
          <Carousel 
            items={featured.data.map((p) => (
              <div key={p.id} className="transition-shadow duration-300 hover:shadow-xl h-full flex flex-col">
                <PropertyCard property={p} />
              </div>
            ))}
            itemsPerView={4}
            gridClassName="sm:grid-cols-2 lg:grid-cols-4"
            viewAllLink="/properties"
            viewAllText="See all properties"
          />
        </div>
      </section>

      {/* Services — FR-HOM-005 */}
      <section className="relative overflow-hidden bg-stone-paper py-14">
        <div className="bg-blueprint-light pointer-events-none absolute inset-0" />
        <div className="container-content relative">
          <Reveal>
            <p className="eyebrow">What We Do</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Services</h2>
          </Reveal>
          <div className="mt-8">
            <Carousel 
              items={services.map((s) => (
                <Link key={s.id} href={`/services/${s.slug}`} className="card-elevated group relative block h-full overflow-hidden p-6">
                  <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brass transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="flex h-11 w-11 items-center justify-center border border-stone-line bg-stone-fog text-brass-dark transition-colors group-hover:border-brass group-hover:bg-brass group-hover:text-ink">
                    <IconBlueprint className="h-5 w-5" />
                  </div>
                  <div className="mt-4 font-display text-lg text-ink transition-colors group-hover:text-brass-dark">{s.title}</div>
                  <p className="mt-2 text-sm text-ink-soft">{s.summary}</p>
                  <span className="mt-4 inline-block text-xs font-semibold text-brass-dark opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more →
                  </span>
                </Link>
              ))}
              itemsPerView={6}
              gridClassName="sm:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        </div>
      </section>

      {/* Projects — FR-HOM-006 */}
      <section className="container-content py-14">
        <Reveal>
          <p className="eyebrow">Portfolio</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Featured Construction Projects</h2>
        </Reveal>
        <div className="mt-8">
          <Carousel 
            items={projects.filter((p) => p.is_featured).map((p) => (
              <Link key={p.id} href={`/projects/${p.slug}`} className="group block h-full">
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
            ))}
            itemsPerView={6}
            gridClassName="sm:grid-cols-2 lg:grid-cols-3"
            viewAllLink="/projects"
            viewAllText="View All Projects"
          />
        </div>
      </section>

      {/* Video Highlight — plays the real reel instead of a frozen thumbnail */}
      <VideoHighlight videoSrc="/images/home/VideoHighlight.mp4" posterSrc="/images/home/VideoThumbnail.webp" />

      {/* Testimonials — FR-HOM-007 */}
      <section className="relative overflow-hidden bg-concrete-900 py-16 text-stone-paper">
        <div className="bg-noise pointer-events-none absolute inset-0 opacity-50" />
        <div className="container-content relative">
          <Reveal>
            <p className="eyebrow text-brass-light">Client Voices</p>
            <h2 className="mt-2 font-display text-2xl text-stone-paper">What Our Clients Say</h2>
          </Reveal>
          <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <StaggerItem key={t.id}>
                <blockquote className="relative h-full border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-brass/60">
                  <IconQuote className="h-6 w-6 text-brass" />
                  <p className="mt-3 text-sm leading-relaxed text-stone-line">{t.quote}</p>
                  <div className="mt-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar key={i} className="h-3.5 w-3.5 text-brass-light" />
                    ))}
                  </div>
                  <footer className="mt-3 text-xs text-brass-light">{t.author_name} — {t.author_location}</footer>
                </blockquote>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Why Dhara — FR-HOM-008 */}
      <section className="container-content py-14">
        <Reveal>
          <p className="eyebrow">Why Dhara</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Built on Trust, Delivered in Concrete</h2>
        </Reveal>
        <StaggerGroup className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            { title: "15+ Years in Operation", body: "A track record spanning civil works, MEP, tower foundations and property development across Sri Lanka." },
            { title: "End-to-End Capability", body: "From land acquisition and design through to construction, fit-out and handover — one accountable team." },
            { title: "Direct From Developer", body: "Every listing is Dhara-built or Dhara-owned — no intermediaries, no third-party commissions." },
          ].map((f, i) => {
            const Icon = WHY_DHARA_ICONS[i % WHY_DHARA_ICONS.length];
            return (
              <StaggerItem key={f.title} className="group">
                <div className="flex h-12 w-12 items-center justify-center border-2 border-brass text-brass-dark transition-colors group-hover:bg-brass group-hover:text-ink">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-lg text-ink">{f.title}</div>
                <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Closing CTA — FR-HOM-009 */}
      <section className="relative overflow-hidden border-t border-stone-line bg-concrete-900 py-16 text-stone-paper">
        <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-30" />
        <Reveal className="container-content relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="eyebrow text-brass-light">Let's Build Together</p>
            <h2 className="mt-2 font-display text-2xl text-stone-paper md:text-3xl">Ready to build, buy or invest?</h2>
            <p className="mt-2 max-w-md text-sm text-stone-line">
              Talk to our team about a property, a design-and-build consultation, or a site inspection.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/contact" className="btn-brass transition-transform hover:-translate-y-0.5 hover:shadow-lg">
              Contact Us
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94763774551"}`}
              className="btn-outline border-stone-paper text-stone-paper transition-transform hover:-translate-y-0.5 hover:bg-stone-paper hover:text-ink"
            >
              WhatsApp
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
