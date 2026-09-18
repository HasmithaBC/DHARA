"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Building,
  MapPin,
  Calendar,
  ArrowRight,
  Filter,
  Sparkles,
  Layers,
  CheckCircle2,
  HardHat,
} from "lucide-react"
import { MOCK_PROJECTS } from "@/lib/mocks"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { ConsultationCta } from "@/components/forms/ConsultationCta"
import { cn } from "@/lib/utils"

const SECTORS = [
  "ALL",
  "Commercial",
  "Residential",
  "Industrial",
  "Hospitality",
  "Infrastructure",
] as const

export default function ProjectsPage() {
  const [selectedSector, setSelectedSector] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  const filteredProjects = React.useMemo(() => {
    return MOCK_PROJECTS.filter((proj) => {
      const matchesSector =
        selectedSector === "ALL" || proj.sector.toLowerCase() === selectedSector.toLowerCase()
      const matchesSearch =
        searchQuery.trim() === "" ||
        proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.client_name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSector && matchesSearch
    })
  }, [selectedSector, searchQuery])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Header */}
      <section className="relative bg-charcoal text-offwhite py-16 lg:py-24 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E2C876_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 space-y-4">
          <Breadcrumbs
            items={[{ label: "Projects & Portfolio" }]}
            className="text-white/60 mb-4"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
            <Building className="w-4 h-4" />
            <span>Turnkey Portfolio & Engineering Case Studies</span>
          </div>
          <h1 className="font-montserrat text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-3xl leading-tight">
            Mastercrafted Civil & Structural Engineering Projects
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-2xl font-sans">
            Explore our multidisciplinary track record spanning high-load transmission mast substructures, luxury residences, commercial complexes, and industrial cold-chain hubs.
          </p>
        </div>
      </section>

      {/* Main Filter & Gallery Section */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-12 lg:py-16 w-full space-y-10">
        {/* Controls: Sector Tabs + Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-border">
          {/* Sector Pill Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {SECTORS.map((sector) => {
              const isActive = selectedSector === sector
              const count =
                sector === "ALL"
                  ? MOCK_PROJECTS.length
                  : MOCK_PROJECTS.filter((p) => p.sector.toLowerCase() === sector.toLowerCase()).length

              return (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all min-h-[40px] border",
                    isActive
                      ? "bg-primary text-charcoal border-primary shadow-md"
                      : "bg-card text-foreground/80 border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span>{sector}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                      isActive ? "bg-charcoal text-white" : "bg-muted text-text-muted"
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72 shrink-0">
            <input
              type="text"
              placeholder="Search by city, title, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-border bg-card px-3.5 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Showing <strong className="text-foreground">{filteredProjects.length}</strong> {filteredProjects.length === 1 ? "project" : "projects"}
          </span>
          {(selectedSector !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSector("ALL")
                setSearchQuery("")
              }}
              className="text-primary hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="group flex flex-col justify-between overflow-hidden border-border bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative aspect-[16/10] w-full bg-charcoal overflow-hidden">
                  <Image
                    src={project.cover_image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <Badge className="bg-charcoal/90 backdrop-blur-md text-white border-white/20 text-xs font-semibold">
                      {project.sector}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-charcoal/80 backdrop-blur-md text-white/90 px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1 border border-white/10">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span>Completed {project.year_completed}</span>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-primary font-medium">{project.client_name}</p>
                      <h3 className="font-montserrat text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-0.5">
                        {project.title}
                      </h3>
                      <p className="text-xs text-text-muted flex items-center gap-1 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        {project.location}
                      </p>
                    </div>

                    <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                      {project.scope}
                    </p>

                    {/* Key Metrics Chips */}
                    {project.boq_metrics && (
                      <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2">
                        {Object.entries(project.boq_metrics)
                          .slice(0, 2)
                          .map(([k, v]) => (
                            <div key={k} className="p-2 rounded bg-muted/60 border border-border/40">
                              <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold truncate">
                                {k}
                              </span>
                              <span className="text-xs font-bold text-foreground font-mono">
                                {String(v)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-auto">
                    <Link href={`/projects/${project.slug}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between group-hover:bg-primary group-hover:text-charcoal group-hover:border-primary transition-all font-semibold text-xs uppercase tracking-wider"
                      >
                        View Project Case Study
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 p-8 rounded-2xl bg-card border border-border space-y-4">
            <Layers className="w-12 h-12 text-text-muted/40 mx-auto" />
            <h3 className="font-montserrat text-lg font-bold text-foreground">
              No Projects Match Your Filter
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Try selecting a different sector or clearing your search term.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSector("ALL")
                setSearchQuery("")
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Bottom Consultation CTA */}
        <ConsultationCta />
      </main>
    </div>
  )
}
