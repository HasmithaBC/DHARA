import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import {
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Layers,
  ArrowRight,
  HardHat,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { fetchProject, fetchProjects, fetchServices, fetchProperties } from "@/lib/api/client"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { BeforeAfterSlider } from "@/components/projects/BeforeAfterSlider"
import { ConsultationCta } from "@/components/forms/ConsultationCta"

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { data: projects } = await fetchProjects()
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: project } = await fetchProject(slug)
  if (!project) return { title: "Project Not Found" }

  return {
    title: `${project.title} — Case Study | Dhara Construction & Technology`,
    description: `${project.sector} case study in ${project.location} executed by Dhara Construction & Technology.`,
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params
  const { data: project } = await fetchProject(slug)
  if (!project) {
    notFound()
  }

  const { data: allServices } = await fetchServices()
  const { data: allProperties } = await fetchProperties()

  // Match used services
  const usedServicesList = allServices.filter(
    (s) => project.services_used?.includes(s.slug)
  )

  // Match available properties in the same district if any
  const regionalProperties = allProperties.filter(
    (p) => project.district_id && p.district_id.toLowerCase() === project.district_id.toLowerCase()
  )

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Header */}
      <section className="relative bg-charcoal text-offwhite py-16 lg:py-24 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E2C876_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 space-y-6">
          <Breadcrumbs
            items={[
              { label: "Projects", href: "/projects" },
              { label: project.title },
            ]}
            className="text-white/60"
          />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-charcoal font-semibold text-xs uppercase tracking-wider">
                  {project.sector} Sector
                </Badge>
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-mono border border-white/20">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Completed {project.year_completed}</span>
                </div>
              </div>

              <h1 className="font-montserrat text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                {project.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {project.location}
                </span>
                <span className="text-white/40">•</span>
                <span>
                  Client: <strong className="text-white">{project.client_name}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-16 lg:py-20 w-full space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main 2-Column Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Interactive Before & After Slider (if available) */}
            {project.before_image && project.after_image ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-montserrat text-lg font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Site Transformation (Before & After)
                  </h3>
                  <span className="text-xs text-text-muted">Drag slider to compare</span>
                </div>
                <BeforeAfterSlider
                  beforeImage={project.before_image}
                  afterImage={project.after_image}
                />
              </div>
            ) : (
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-border shadow-lg bg-charcoal">
                <Image
                  src={project.cover_image}
                  alt={project.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Project Overview & Narrative */}
            <div className="space-y-4">
              <h2 className="font-montserrat text-2xl font-bold text-foreground">
                Project Overview & Execution Scope
              </h2>
              <p className="text-base text-text-muted leading-relaxed whitespace-pre-line">
                {project.body}
              </p>
            </div>

            {/* Engineering Challenge & Solution Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Challenge */}
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>The Engineering Challenge</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {project.challenge}
                </p>
              </div>

              {/* Solution */}
              <div className="p-6 rounded-2xl bg-primary/10 border border-primary/30 space-y-3">
                <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm">
                  <Lightbulb className="w-5 h-5" />
                  <span>Dhara's Structural Solution</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {project.solution}
                </p>
              </div>
            </div>

            {/* Additional Gallery */}
            {project.gallery && project.gallery.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="font-montserrat text-xl font-bold text-foreground">
                  Project Gallery & Construction Snapshots
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.gallery.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border shadow-sm bg-charcoal"
                    >
                      <Image
                        src={img}
                        alt={`${project.title} image ${i + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services Utilized in this Project */}
            {usedServicesList.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="font-montserrat text-xl font-bold text-foreground">
                  Engineering Capabilities Employed
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {usedServicesList.map((srv) => (
                    <Link
                      key={srv.id}
                      href={`/services/${srv.slug}`}
                      className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors block">
                          {srv.title}
                        </span>
                        <span className="text-xs text-text-muted line-clamp-1">
                          {srv.summary}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary shrink-0 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: BOQ Metrics & Regional Properties */}
          <div className="space-y-8">
            <div className="sticky top-24 space-y-6">
              {/* Scale & BOQ Metrics Card */}
              {project.boq_metrics && (
                <Card className="border-border bg-card shadow-sm overflow-hidden">
                  <div className="bg-charcoal text-white p-5 border-b border-white/10 flex items-center gap-2.5">
                    <HardHat className="w-5 h-5 text-primary" />
                    <h3 className="font-montserrat font-bold text-base">
                      Scale & Technical Metrics
                    </h3>
                  </div>
                  <CardContent className="p-5 space-y-3 divide-y divide-border/60">
                    {Object.entries(project.boq_metrics).map(([label, value]) => (
                      <div key={label} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                        <span className="text-xs text-text-muted font-medium">{label}</span>
                        <span className="text-xs font-mono font-bold text-foreground text-right">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Consultation Trigger */}
              <ConsultationCta
                variant="general"
                serviceTitle={`Civil Construction inspired by ${project.title}`}
              />

              {/* Available Properties in Same Region */}
              {regionalProperties.length > 0 && (
                <Card className="border-border bg-card shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Regional Real Estate
                      </span>
                      <h4 className="font-montserrat font-bold text-base text-foreground">
                        Available Plots in {project.district_id}
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {regionalProperties.slice(0, 2).map((prop) => (
                        <Link
                          key={prop.id}
                          href={`/properties/${prop.category.toLowerCase()}/${prop.slug}`}
                          className="block p-3 rounded-lg border border-border/80 hover:border-primary/50 transition-colors bg-muted/40"
                        >
                          <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                            <span>{prop.reference_code}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {prop.category}
                            </Badge>
                          </div>
                          <p className="text-xs font-bold text-foreground mt-1 line-clamp-1">
                            {prop.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Consultation CTA */}
        <ConsultationCta />
      </main>
    </div>
  )
}
