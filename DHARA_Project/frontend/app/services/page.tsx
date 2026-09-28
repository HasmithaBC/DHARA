import Link from "next/link";
import Image from "next/image";
import { fetchServices } from "@/lib/api";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { IconBlueprint, IconCheckShield, IconCube } from "@/components/icons";

const WHY_ICONS = [IconCheckShield, IconBlueprint, IconCube];

export const metadata = {
  title: "Services",
  description:
    "Dhara's full range of construction, engineering and design services — civil construction, tower foundations, architectural design, MEP, interiors, BOQ and 3D visualisation.",
};

export default async function ServicesPage() {
  const services = await fetchServices();
  return (
    <div>
      {/* Hero */}
      <div className="relative aspect-[21/7] w-full overflow-hidden bg-stone-fog">
        <Image src="/images/services/banner_image.webp" alt="Dhara Construction Services" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-concrete-900/55" />
        <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-content absolute inset-0 flex flex-col justify-end pb-10">
          <p className="eyebrow fade-in-up fade-in-up-1 text-brass-light">What We Do</p>
          <h1 className="fade-in-up fade-in-up-2 mt-3 font-display text-3xl text-stone-paper md:text-4xl">Services</h1>
          <p className="fade-in-up fade-in-up-3 mt-3 max-w-xl text-sm text-stone-line">
            From first survey to final handover — civil construction, design, MEP and specialist engineering
            delivered by Dhara's in-house teams.
          </p>
        </div>
      </div>

      {/* Intro */}
      <section className="container-content py-14">
        <Reveal className="max-w-3xl">
          <p className="text-sm leading-relaxed text-ink-soft">
            Dhara provides an integrated suite of construction, engineering and design services — enabling clients to engage
            a single team from initial concept through to project completion. Our in-house capability spans every major
            discipline of building construction and property development, eliminating the coordination risk that comes with
            fragmented procurement.
          </p>
        </Reveal>

        {/* Service Grid */}
        <StaggerGroup className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <StaggerItem key={s.id}>
              <Link href={`/services/${s.slug}`} className="card-elevated group block overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
                  <Image
                    src={s.hero_image}
                    alt={s.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-concrete-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="p-5">
                  <h2 className="font-display text-lg text-ink transition-colors group-hover:text-brass-dark">{s.title}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{s.summary}</p>
                  <span className="mt-4 inline-block text-xs font-semibold text-brass-dark opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more →
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Why choose Dhara */}
      <section className="relative overflow-hidden border-t border-stone-line bg-stone-paper py-14">
        <div className="bg-blueprint-light pointer-events-none absolute inset-0" />
        <div className="container-content relative">
          <Reveal>
            <p className="eyebrow">Why Choose Dhara</p>
            <h2 className="mt-2 font-display text-2xl text-ink">End-to-End. In-House. Accountable.</h2>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Single Point of Contact",
                body: "One team manages every discipline — no finger-pointing between separate contractors and designers.",
              },
              {
                title: "Design-Led Construction",
                body: "Our designs are tested against real build costs and construction sequences before the first drawing is issued.",
              },
              {
                title: "Transparent Pricing",
                body: "Independently prepared BOQs and open-book cost reporting give clients full visibility at every stage.",
              },
            ].map((f, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
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
        </div>
      </section>

      {/* CTA */}
      <section className="container-content py-14">
        <Reveal className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl text-ink">Have a project in mind?</h2>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              Tell our team what you're planning — whether it's a new build, a specialist engineering package or a property
              investment — and we'll outline how Dhara can help.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="btn-primary transition-transform hover:-translate-y-0.5">
              Request a Consultation
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94763774551"}`}
              className="btn-brass transition-transform hover:-translate-y-0.5"
            >
              WhatsApp
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
