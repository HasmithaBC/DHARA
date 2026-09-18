import * as React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import {
  Building2,
  Radio,
  Compass,
  Zap,
  Palette,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  HardHat,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react"
import { fetchService, fetchServices, fetchProjects } from "@/lib/api/client"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { ConsultationCta } from "@/components/forms/ConsultationCta"

const ICON_MAP: Record<string, React.ReactNode> = {
  Building2: <Building2 className="w-8 h-8 text-primary" />,
  Radio: <Radio className="w-8 h-8 text-primary" />,
  Compass: <Compass className="w-8 h-8 text-primary" />,
  Zap: <Zap className="w-8 h-8 text-primary" />,
  Palette: <Palette className="w-8 h-8 text-primary" />,
  Calculator: <Calculator className="w-8 h-8 text-primary" />,
  ShieldCheck: <ShieldCheck className="w-8 h-8 text-primary" />,
}

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { data: services } = await fetchServices()
  return services.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: service } = await fetchService(slug)
  if (!service) return { title: "Service Not Found" }

  return {
    title: `${service.title} | Dhara Construction & Technology`,
    description: service.summary,
  }
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params
  const { data: service } = await fetchService(slug)
  if (!service) {
    notFound()
  }

  const { data: allProjects } = await fetchProjects()
  // Filter projects related to this service or matching sectors
  const relatedProjects = allProjects.filter(
    (p) =>
      p.services_used?.includes(service.slug) ||
      (service.sectors && service.sectors.includes(p.sector))
  )

  const icon = ICON_MAP[service.icon] || <Building2 className="w-8 h-8 text-primary" />

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Header */}
      <section className="relative bg-charcoal text-offwhite py-16 lg:py-24 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E2C876_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 space-y-6">
          <Breadcrumbs
            items={[
              { label: "Services", href: "/services" },
              { label: service.title },
            ]}
            className="text-white/60"
          />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-semibold">
                {icon}
                <span>CIDA & ISO Certified Engineering Discipline</span>
              </div>
              <h1 className="font-montserrat text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                {service.title}
              </h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed font-sans">
                {service.summary}
              </p>

              {service.sectors && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs uppercase tracking-wider text-white/60 font-semibold mr-1">
                    Applicable Sectors:
                  </span>
                  {service.sectors.map((sec) => (
                    <Badge key={sec} variant="secondary" className="bg-white/10 text-white border-white/20">
                      {sec}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-16 lg:py-20 w-full space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main 2-Column Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Scope Overview */}
            <div className="space-y-4">
              <h2 className="font-montserrat text-2xl font-bold text-foreground flex items-center gap-2">
                <HardHat className="w-6 h-6 text-primary" />
                Comprehensive Scope of Engineering
              </h2>
              <p className="text-base text-text-muted leading-relaxed">
                {service.body}
              </p>
            </div>

            {/* Core Deliverables */}
            {service.deliverables && service.deliverables.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-montserrat text-xl font-bold text-foreground">
                  Key Technical Deliverables
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {service.deliverables.map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-card border border-border flex items-start gap-3 shadow-sm hover:border-primary/40 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-foreground leading-snug">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step-by-Step Execution Process */}
            {service.process_steps && service.process_steps.length > 0 && (
              <div className="space-y-6 pt-4">
                <div>
                  <h3 className="font-montserrat text-2xl font-bold text-foreground">
                    Our Structured Engineering Workflow
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Every project follows strict quality gates and statutory sign-offs from mobilization to commissioning.
                  </p>
                </div>

                <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-border/60">
                  {service.process_steps.map((step) => (
                    <div key={step.step} className="relative flex items-start gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-charcoal text-primary border-2 border-primary font-mono font-bold text-sm flex items-center justify-center shrink-0 z-10 shadow-md">
                        0{step.step}
                      </div>
                      <div className="flex-1 bg-card p-5 rounded-xl border border-border group-hover:border-primary/40 transition-colors shadow-sm">
                        <h4 className="font-montserrat font-bold text-base text-foreground">
                          {step.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-text-muted mt-1.5 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Consultation & Quick Contacts */}
          <div className="space-y-8">
            <div className="sticky top-24 space-y-6">
              <ConsultationCta
                variant="service-detail"
                serviceSlug={service.slug}
                serviceTitle={service.title}
              />

              {/* Quality & Assurance Card */}
              <Card className="border-border bg-card">
                <CardContent className="p-6 space-y-4">
                  <h4 className="font-montserrat font-bold text-base text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    The Dhara Advantage
                  </h4>
                  <ul className="space-y-2.5 text-xs text-text-muted">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Direct Chartered Engineer Site Supervision</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Transparent Rate Schedules & BOQ Audits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>10-Year Structural Structural Warranties</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>In-House Plant, Machinery & Heavy Piling Rigs</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Projects Showcase */}
        {relatedProjects.length > 0 && (
          <section className="pt-12 border-t border-border space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                  Proven Execution
                </span>
                <h3 className="font-montserrat text-2xl sm:text-3xl font-bold text-foreground mt-1">
                  Projects Utilizing This Capability
                </h3>
              </div>
              <Link href="/projects">
                <Button variant="outline" size="sm" className="font-semibold text-xs uppercase">
                  View Full Portfolio
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProjects.slice(0, 3).map((project) => (
                <Card
                  key={project.id}
                  className="group overflow-hidden border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs font-medium">
                        {project.sector}
                      </Badge>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {project.year_completed}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-montserrat font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-xs text-text-muted flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        {project.location}
                      </p>
                    </div>

                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {project.scope}
                    </p>

                    <div className="pt-3 border-t border-border/60">
                      <Link href={`/projects/${project.slug}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between p-0 text-primary hover:text-primary hover:bg-transparent font-semibold text-xs uppercase"
                        >
                          Read Project Case Study
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
