import * as React from "react"
import Link from "next/link"
import { Metadata } from "next"
import {
  Building2,
  Radio,
  Compass,
  Zap,
  Palette,
  Calculator,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  HardHat,
  Award,
  Layers,
} from "lucide-react"
import { fetchServices } from "@/lib/api/client"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { ConsultationCta } from "@/components/forms/ConsultationCta"

export const metadata: Metadata = {
  title: "Engineering & Construction Services | Dhara Construction & Technology",
  description:
    "Explore Dhara's turnkey civil engineering, deep tower foundations, architectural BIM design, MEP systems, interior fit-outs, and BOQ auditing across Sri Lanka.",
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Building2: <Building2 className="w-7 h-7 text-primary" />,
  Radio: <Radio className="w-7 h-7 text-primary" />,
  Compass: <Compass className="w-7 h-7 text-primary" />,
  Zap: <Zap className="w-7 h-7 text-primary" />,
  Palette: <Palette className="w-7 h-7 text-primary" />,
  Calculator: <Calculator className="w-7 h-7 text-primary" />,
  ShieldCheck: <ShieldCheck className="w-7 h-7 text-primary" />,
}

export default async function ServicesPage() {
  const { data: services } = await fetchServices()
  const sortedServices = [...services].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header Banner */}
      <section className="relative bg-charcoal text-offwhite py-16 lg:py-24 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E2C876_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 space-y-4">
          <Breadcrumbs
            items={[{ label: "Services" }]}
            className="text-white/60 mb-4"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
            <HardHat className="w-4 h-4" />
            <span>Turnkey Engineering & CIDA Compliant</span>
          </div>
          <h1 className="font-montserrat text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-3xl leading-tight">
            Comprehensive Construction & Structural Engineering Capabilities
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-2xl font-sans">
            From precision deep foundations and multi-storey commercial frames to chartered architectural BIM models and bespoke interiors.
          </p>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-16 lg:py-24 max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 w-full space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedServices.map((service, index) => {
            const icon = ICON_MAP[service.icon] || <Building2 className="w-7 h-7 text-primary" />
            return (
              <Card
                key={service.id}
                className="group hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden border-border bg-card"
              >
                <CardContent className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {icon}
                      </div>
                      <span className="font-mono text-2xl font-bold text-text-muted/30">
                        0{index + 1}
                      </span>
                    </div>

                    <div>
                      <h2 className="font-montserrat text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {service.title}
                      </h2>
                      <p className="text-sm text-text-muted mt-2 line-clamp-3 leading-relaxed">
                        {service.summary}
                      </p>
                    </div>

                    {service.sectors && service.sectors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {service.sectors.map((sec) => (
                          <Badge key={sec} variant="secondary" className="text-[11px]">
                            {sec}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {service.deliverables && service.deliverables.length > 0 && (
                      <ul className="space-y-2 pt-2 border-t border-border/60">
                        {service.deliverables.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start text-xs text-foreground/80 gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-4 mt-auto">
                    <Link href={`/services/${service.slug}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between group-hover:bg-primary group-hover:text-charcoal group-hover:border-primary transition-all font-semibold text-xs uppercase tracking-wider"
                      >
                        Explore Service Scope
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Why Choose Dhara Engineering Band */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-2xl bg-muted/50 border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-base text-foreground">CIDA Certified Standards</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                All structural works undergo rigorous compressive testing, non-destructive cube tests, and formal engineer sign-offs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-base text-foreground">Integrated BIM Coordination</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Architectural, structural, and MEP disciplines model clash-free blueprints prior to site mobilization, preventing cost variations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-base text-foreground">Transparent BOQ Valuation</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Fixed-scope rate schedules with itemized quantity takeoffs ensure zero hidden costs and predictable financial milestones.
              </p>
            </div>
          </div>
        </div>

        {/* Closing CTA */}
        <ConsultationCta />
      </section>
    </div>
  )
}
