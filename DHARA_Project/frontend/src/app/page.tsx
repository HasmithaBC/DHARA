"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Building2, 
  Compass, 
  Radio, 
  Zap, 
  Palette, 
  Calculator, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Phone, 
  MessageCircle, 
  Star, 
  Sparkles, 
  Layers, 
  Award, 
  Ruler, 
  ShieldCheck,
  Search,
  BedDouble,
  Bath,
  Maximize2
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { MOCK_SERVICES, MOCK_PROPERTIES, MOCK_PROJECTS, MOCK_TESTIMONIALS } from "@/lib/mocks"

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  Building2: <Building2 className="h-6 w-6 text-charcoal" />,
  Radio: <Radio className="h-6 w-6 text-charcoal" />,
  Compass: <Compass className="h-6 w-6 text-charcoal" />,
  Zap: <Zap className="h-6 w-6 text-charcoal" />,
  Palette: <Palette className="h-6 w-6 text-charcoal" />,
  Calculator: <Calculator className="h-6 w-6 text-charcoal" />,
}

export default function Home() {
  const [activeCategory, setActiveCategory] = React.useState<"ALL" | "LAND" | "HOUSE" | "COMMERCIAL">("ALL")
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredProperties = MOCK_PROPERTIES.filter(property => {
    const matchesCategory = activeCategory === "ALL" || property.category === activeCategory
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          property.city_id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* 1. HERO SECTION */}
      <section className="relative bg-charcoal text-offwhite py-20 lg:py-32 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#E2C876_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Concepts Into Creation • Built Since 2007</span>
            </div>

            <h1 className="font-montserrat text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
              Engineering Precision. <br />
              <span className="text-primary">Architectural Mastery.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-2xl font-sans">
              Delivering turnkey civil construction, deep tower substructures, bespoke architectural engineering, and verified prime real estate across Sri Lanka.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/properties">
                <Button size="lg" className="font-semibold shadow-lg shadow-primary/20">
                  Explore Properties
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                  Our Engineering Services
                </Button>
              </Link>
              <a href="https://wa.me/94763774551" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Quick WhatsApp
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Search Card */}
          <div className="mt-12 lg:mt-16 bg-white dark:bg-charcoal-light rounded-xl p-4 sm:p-6 shadow-xl border border-border/80 max-w-4xl text-charcoal">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-text-muted">
                Quick Property Finder
              </span>
              <div className="flex items-center gap-2 overflow-x-auto">
                {(["ALL", "LAND", "HOUSE", "COMMERCIAL"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeCategory === cat 
                        ? "bg-primary text-charcoal shadow-sm" 
                        : "bg-muted text-text-muted hover:text-foreground"
                    }`}
                  >
                    {cat === "ALL" ? "All Types" : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by city, location or keyword (e.g. Battaramulla, Colombo, Land)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-offwhite text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <Link href="/properties">
                <Button className="w-full sm:w-auto h-11 px-6 font-semibold">
                  Find Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & CREDIBILITY BAR */}
      <section className="bg-primary text-charcoal py-8 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="font-montserrat text-3xl sm:text-4xl font-bold">17+</div>
            <div className="text-xs sm:text-sm font-medium tracking-wide uppercase opacity-90">Years Experience</div>
          </div>
          <div className="space-y-1">
            <div className="font-montserrat text-3xl sm:text-4xl font-bold">250+</div>
            <div className="text-xs sm:text-sm font-medium tracking-wide uppercase opacity-90">Delivered Projects</div>
          </div>
          <div className="space-y-1">
            <div className="font-montserrat text-3xl sm:text-4xl font-bold">100%</div>
            <div className="text-xs sm:text-sm font-medium tracking-wide uppercase opacity-90">CIDA Compliance</div>
          </div>
          <div className="space-y-1">
            <div className="font-montserrat text-3xl sm:text-4xl font-bold">50+</div>
            <div className="text-xs sm:text-sm font-medium tracking-wide uppercase opacity-90">Verified Listings</div>
          </div>
        </div>
      </section>

      {/* 3. CORE ENGINEERING SERVICES */}
      <section className="py-20 lg:py-24 max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Layers className="h-4 w-4" />
              <span>Full-Stack Capabilities</span>
            </div>
            <h2 className="font-montserrat text-3xl sm:text-4xl font-bold text-foreground">
              End-to-End Construction & Engineering Disciplines
            </h2>
            <p className="text-text-muted text-base">
              From geotechnical survey and structural engineering to turnkey handover and interior fit-outs.
            </p>
          </div>
          <Link href="/services">
            <Button variant="outline" className="border-border">
              View All Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_SERVICES.map((service) => (
            <Card key={service.id} className="group hover:border-primary/60 hover:shadow-lg transition-all duration-300 bg-white">
              <CardHeader className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary transition-colors">
                  {SERVICE_ICONS[service.icon] || <Building2 className="h-6 w-6 text-charcoal" />}
                </div>
                <div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">
                    {service.summary}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={`/services/${service.slug}`}
                  className="inline-flex items-center text-sm font-semibold text-charcoal group-hover:text-primary transition-colors"
                >
                  Explore Discipline
                  <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. FEATURED REAL ESTATE PROPERTIES */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Award className="h-4 w-4" />
                <span>Prime Real Estate</span>
              </div>
              <h2 className="font-montserrat text-3xl sm:text-4xl font-bold text-foreground">
                Featured Properties & Verified Land Parcels
              </h2>
              <p className="text-text-muted text-base">
                Directly vetted with clear deeds, infrastructure readiness, and pre-evaluated construction feasibility.
              </p>
            </div>
            <Link href="/properties">
              <Button variant="outline" className="border-border">
                Browse All Properties
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => {
              const formattedPrice = property.price_lkr 
                ? property.price_unit === "PER_PERCH"
                  ? `LKR ${(property.price_lkr / 100000).toFixed(1)} Lakhs / Perch`
                  : property.price_unit === "PER_MONTH"
                  ? `LKR ${(property.price_lkr).toLocaleString()} / Mo`
                  : `LKR ${(property.price_lkr / 1000000).toFixed(1)} Million`
                : "Price on Request"

              return (
                <div 
                  key={property.id} 
                  className="bg-white rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Image Placeholder Banner */}
                  <div className="relative h-52 bg-charcoal flex items-center justify-center p-6 text-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#E2C876_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative z-10">
                      <Building2 className="h-12 w-12 text-primary mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-white/60 tracking-wider font-mono">{property.reference_code}</span>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="default" className="shadow-sm">
                        {property.category}
                      </Badge>
                      <Badge variant="secondary" className="shadow-sm">
                        FOR {property.listing_type}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center text-xs text-text-muted mb-2 gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{property.address_line || property.city_id}</span>
                      </div>
                      <h3 className="font-montserrat font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {property.title}
                      </h3>
                      <p className="text-sm text-text-muted mt-2 line-clamp-2">
                        {property.short_description}
                      </p>
                    </div>

                    {/* Specs info */}
                    <div className="pt-4 border-t border-border/80 flex items-center justify-between text-xs text-text-muted">
                      {property.land_extent_perches && (
                        <div className="flex items-center gap-1">
                          <Maximize2 className="h-3.5 w-3.5 text-primary" />
                          <span>{property.land_extent_perches} Perches</span>
                        </div>
                      )}
                      {property.built_area_sqft && (
                        <div className="flex items-center gap-1">
                          <Ruler className="h-3.5 w-3.5 text-primary" />
                          <span>{property.built_area_sqft.toLocaleString()} Sqft</span>
                        </div>
                      )}
                      {property.bedrooms && (
                        <div className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5 text-primary" />
                          <span>{property.bedrooms} Beds</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5 text-primary" />
                          <span>{property.bathrooms} Baths</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing and Action */}
                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-text-muted">Price</div>
                        <div className="font-montserrat font-bold text-base sm:text-lg text-foreground">
                          {formattedPrice}
                        </div>
                      </div>
                      <Link href={`/properties/${property.slug}`}>
                        <Button size="sm" className="font-medium">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE DHARA (TRUST PILLARS) */}
      <section className="py-20 lg:py-24 max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>The Dhara Advantage</span>
            </div>
            <h2 className="font-montserrat text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Why Sri Lanka's Leading Investors & Homeowners Choose Dhara
            </h2>
            <p className="text-text-muted text-base leading-relaxed">
              We combine deep geotechnical and civil engineering rigour with transparent commercial practices, guaranteeing on-time execution, statutory compliance, and unmatched structural longevity.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Chartered Engineering & Architectural Staff</h4>
                  <p className="text-xs text-text-muted mt-0.5">In-house registered structural engineers, architects, and quantity surveyors overseeing every project phase.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Transparent Itemized BOQ Billing</h4>
                  <p className="text-xs text-text-muted mt-0.5">Comprehensive, audited Bills of Quantities protecting your budget against unpredictable cost escalations.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">End-to-End Statutory Approval Management</h4>
                  <p className="text-xs text-text-muted mt-0.5">Seamless approvals across UDA, local municipal councils, CEA, and NBRO hazard zones.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Comprehensive Turnkey Land-to-Living Handover</h4>
                  <p className="text-xs text-text-muted mt-0.5">We help you acquire prime verified land, design your structure, construct it, and deliver keys in hand.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-charcoal text-offwhite p-8 sm:p-10 rounded-2xl border border-white/10 shadow-2xl space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <h3 className="font-montserrat text-xl font-bold text-white">Client Experience</h3>
                <p className="text-xs text-white/60">Verified reviews from our project partners</p>
              </div>
              <div className="flex gap-1 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary" />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {MOCK_TESTIMONIALS.map((testimonial) => (
                <div key={testimonial.id} className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-sm italic text-white/80 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">{testimonial.author_name}</span>
                    <span className="text-white/50">{testimonial.author_location}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link href="/contact">
                <Button className="w-full font-semibold">
                  Schedule an Engineering Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="bg-charcoal text-offwhite py-16 border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E2C876_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <h2 className="font-montserrat text-3xl sm:text-4xl font-bold text-white">
              Ready to Turn Your Vision Into Reality?
            </h2>
            <p className="text-white/75 text-base">
              Speak with our senior civil engineers and architects today for site inspections, BOQ valuations, and custom architectural planning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href="tel:+94763774551">
              <Button size="lg" className="font-semibold">
                <Phone className="mr-2 h-5 w-5" />
                Call +94 76 377 4551
              </Button>
            </a>
            <a href="https://wa.me/94763774551" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Us
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

