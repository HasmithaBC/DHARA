import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";

export const metadata = {
  title: "About Us",
  description:
    "Learn about Dhara Construction and Technology — 15+ years of civil engineering, architecture, MEP and property development across Sri Lanka.",
};

const team = [
  {
    name: "Kosala Dharmapriya",
    role: "Founder & Chairman",
    image: "/images/about/chairman.webp",
    bio: "Visionary behind Dhara's integrated construction-to-property model, with over 20 years of experience in civil engineering and real estate development across Sri Lanka.",
  },
  {
    name: "Managing Director",
    role: "Founder & CEO",
    image: "/images/about/FounderCeo.webp",
    bio: "Leads day-to-day operations and project delivery, ensuring every client receives the same standard of engineering excellence that Dhara is known for.",
  },
  {
    name: "Chief Executive",
    role: "CEO",
    image: "/images/about/CEO.webp",
    bio: "Drives Dhara's strategic growth across construction, property and technology services, with a focus on quality, client satisfaction and sustainable development.",
  },
  {
    name: "Design Principal",
    role: "Head of Design",
    image: "/images/about/DesignHead.webp",
    bio: "Leads all architectural and structural design output, from concept sketches through to construction issue drawings, ensuring design intent is realised on site.",
  },
  {
    name: "Lead Architect",
    role: "Architect",
    image: "/images/about/architect.webp",
    bio: "Responsible for residential and commercial architectural design, local authority submissions and client design presentations.",
  },
  {
    name: "Finance Director",
    role: "Finance",
    image: "/images/about/finance.webp",
    bio: "Manages project cost control, BOQ and client billing — providing the financial transparency that underpins Dhara's trusted client relationships.",
  },
  {
    name: "General Manager",
    role: "General Manager",
    image: "/images/about/general.webp",
    bio: "Oversees procurement, resource planning and supply chain management to keep projects on programme and on budget.",
  },
  {
    name: "Project Manager",
    role: "Project Manager",
    image: "/images/about/pm.webp",
    bio: "On-site leadership for Dhara's construction projects, coordinating trades, managing sub-contractors and enforcing quality and safety standards.",
  },
];

const milestones = [
  { year: "2008", event: "Dhara Construction founded in Sri Lanka" },
  { year: "2012", event: "First telecom tower foundation contract awarded" },
  { year: "2015", event: "Architectural design division established" },
  { year: "2018", event: "MEP and interiors division launched" },
  { year: "2020", event: "Property development and direct listings platform launched" },
  { year: "2022", event: "3D visualisation studio established" },
  { year: "2024", event: "120+ projects completed across Sri Lanka" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative aspect-[21/8] w-full overflow-hidden bg-stone-fog">
        <Image src="/images/about/AboutHeroBanner.webp" alt="Dhara Construction and Technology" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-concrete-900/50" />
        <div className="container-content absolute inset-0 flex flex-col justify-end pb-10">
          <p className="eyebrow fade-in-up fade-in-up-1 text-brass-light">About Dhara</p>
          <h1 className="fade-in-up fade-in-up-2 mt-3 font-display text-3xl text-stone-paper md:text-4xl">
            Concepts Into Creation
          </h1>
        </div>
      </div>

      {/* Our Story */}
      <div className="container-content grid gap-12 py-16 md:grid-cols-2">
        <Reveal>
          <p className="eyebrow">Our Story</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Building Sri Lanka, One Project at a Time</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Dhara Construction and Technology (Pvt) Ltd was founded to bridge the gap between civil engineering excellence and
            property development in Sri Lanka. Over 15 years we have grown from a focused civil contractor into a fully
            integrated construction and property company — capable of taking a project from initial land assessment through
            design, engineering, construction, fit-out and final sale or lease.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Our services span civil construction, tower foundations and substructures, architectural and structural design,
            MEP systems, interior design, BOQ and cost auditing, and 3D visualisation. We also develop and market our own
            land, house and commercial assets directly to buyers, tenants and overseas Sri Lankan investors — removing
            the dependency on third-party portals.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            This end-to-end capability means a client who buys a plot of land through Dhara can move directly into
            design and build with the same team that managed the transaction — with a single point of accountability
            from start to handover.
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/services" className="btn-primary transition-transform hover:-translate-y-0.5">
              Our Services
            </Link>
            <Link href="/contact" className="btn-outline transition-transform hover:-translate-y-0.5">
              Get in Touch
            </Link>
          </div>
        </Reveal>
        <Reveal direction="left" delay={0.1}>
          <div className="relative aspect-[4/3] overflow-hidden bg-stone-fog">
            <Image src="/images/about/Vision.webp" alt="Dhara — our vision" fill className="object-cover" />
          </div>
        </Reveal>
      </div>

      {/* Key Facts */}
      <div className="border-t border-stone-line bg-stone-paper py-14">
        <div className="container-content">
          <StaggerGroup className="grid gap-8 sm:grid-cols-3">
            {[
              { title: "Licensed & Certified", body: "Operating under Sri Lankan civil engineering and construction industry certifications." },
              { title: "15+ Years", body: "In civil works, tower foundations, MEP and property development across Sri Lanka." },
              { title: "End-to-End", body: "Land, design, construction, interiors and handover — one accountable team." },
            ].map((f) => (
              <StaggerItem key={f.title}>
                <div className="border-t border-stone-line pt-4 transition-colors hover:border-brass">
                  <div className="font-display text-lg text-ink">{f.title}</div>
                  <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>

      {/* Vision & Mission */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <Image src="/images/about/DoBestBanner.webp" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-concrete-900/75" />
        </div>
        <div className="container-content relative">
          <Reveal>
            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <p className="eyebrow text-brass-light">Our Vision</p>
                <h2 className="mt-3 font-display text-2xl text-stone-paper">To be Sri Lanka's most trusted integrated construction and property company</h2>
                <p className="mt-4 text-sm leading-relaxed text-stone-line">
                  We aim to set the benchmark for quality, transparency and client service in every segment we operate —
                  from specialist infrastructure to residential design-and-build and direct property sales.
                </p>
              </div>
              <div>
                <p className="eyebrow text-brass-light">Our Mission</p>
                <h2 className="mt-3 font-display text-2xl text-stone-paper">Deliver every project on time, on budget and to specification</h2>
                <p className="mt-4 text-sm leading-relaxed text-stone-line">
                  By combining in-house engineering, design and construction capability with a direct-to-market property platform,
                  we eliminate the inefficiencies that plague conventional procurement chains — giving clients better value
                  at every stage.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Company Milestones */}
      <section className="container-content py-16">
        <Reveal>
          <p className="eyebrow">Our Journey</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Key Milestones</h2>
        </Reveal>
        <StaggerGroup className="mt-10 grid gap-px bg-stone-line sm:grid-cols-2 lg:grid-cols-4">
          {milestones.slice(0, 4).map((m) => (
            <StaggerItem key={m.year}>
              <div className="bg-stone-paper p-6">
                <div className="font-display text-2xl text-brass">{m.year}</div>
                <p className="mt-2 text-sm text-ink-soft">{m.event}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
        <StaggerGroup className="mt-px grid gap-px bg-stone-line sm:grid-cols-2 lg:grid-cols-3">
          {milestones.slice(4).map((m) => (
            <StaggerItem key={m.year}>
              <div className="bg-stone-paper p-6">
                <div className="font-display text-2xl text-brass">{m.year}</div>
                <p className="mt-2 text-sm text-ink-soft">{m.event}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Team */}
      <section className="bg-stone-paper py-16">
        <div className="container-content">
          <Reveal>
            <p className="eyebrow">The People Behind Dhara</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Our Leadership Team</h2>
            <p className="mt-3 max-w-xl text-sm text-ink-soft">
              A multidisciplinary team of engineers, architects, project managers and business professionals — united by a
              commitment to delivering outstanding construction and property outcomes across Sri Lanka.
            </p>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <StaggerItem key={member.name}>
                <div className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-fog">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-concrete-900/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
                      <p className="text-xs leading-relaxed text-stone-line">{member.bio}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="font-display text-base text-ink">{member.name}</div>
                    <div className="mt-0.5 text-xs text-brass-dark">{member.role}</div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Recognition */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <Image src="/images/about/RecognitionBanner.webp" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-concrete-900/70" />
        </div>
        <div className="container-content relative">
          <Reveal className="text-center">
            <p className="eyebrow text-brass-light">Recognition</p>
            <h2 className="mt-3 font-display text-3xl text-stone-paper">Trusted Across Sri Lanka</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-stone-line">
              From individual homeowners to corporate clients and government authorities — Dhara has built a reputation for
              engineering quality, schedule reliability and honest dealing.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/projects" className="btn-brass transition-transform hover:-translate-y-0.5">
                View Our Projects
              </Link>
              <Link href="/contact" className="btn-outline border-stone-paper text-stone-paper transition-transform hover:-translate-y-0.5 hover:bg-stone-paper hover:text-ink">
                Work With Us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
