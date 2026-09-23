"use client"

import * as React from "react"
import { useAdminStore } from "@/lib/store/adminStore"
import { PropertiesManager } from "@/components/admin/PropertiesManager"
import { ServicesManager } from "@/components/admin/ServicesManager"
import { ProjectsManager } from "@/components/admin/ProjectsManager"
import {
  Building2,
  HardHat,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminDashboardPage() {
  const { properties, services, projects, isInitialized } = useAdminStore()
  const [activeTab, setActiveTab] = React.useState<"properties" | "services" | "projects">("properties")

  const publishedPropertiesCount = properties.filter((p) => p.status === "PUBLISHED").length

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-charcoal via-charcoal to-charcoal-light p-6 sm:p-8 text-white border border-white/10 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dhara Administration Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-bold tracking-tight">
            Inventory & Capabilities Management
          </h1>
          <p className="text-xs sm:text-sm text-white/75 max-w-2xl font-sans leading-relaxed">
            Create, update, view, and delete records across Properties, Engineering Services, and Project Case Studies. All changes persist automatically.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Properties Stat */}
        <div
          onClick={() => setActiveTab("properties")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer bg-card shadow-sm hover:border-primary/50 group",
            activeTab === "properties" ? "border-primary ring-2 ring-primary/20" : "border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Properties
            </span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-foreground">{properties.length}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {publishedPropertiesCount} Published
            </span>
          </div>
        </div>

        {/* Services Stat */}
        <div
          onClick={() => setActiveTab("services")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer bg-card shadow-sm hover:border-primary/50 group",
            activeTab === "services" ? "border-primary ring-2 ring-primary/20" : "border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Services
            </span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <HardHat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-foreground">{services.length}</span>
            <span className="text-xs text-text-muted font-medium">Engineering Disciplines</span>
          </div>
        </div>

        {/* Projects Stat */}
        <div
          onClick={() => setActiveTab("projects")}
          className={cn(
            "p-5 rounded-2xl border transition-all cursor-pointer bg-card shadow-sm hover:border-primary/50 group",
            activeTab === "projects" ? "border-primary ring-2 ring-primary/20" : "border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Projects
            </span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-foreground">{projects.length}</span>
            <span className="text-xs text-text-muted font-medium">Case Studies</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher Pills */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/60 border border-border w-fit">
        <button
          onClick={() => setActiveTab("properties")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all",
            activeTab === "properties"
              ? "bg-card text-foreground shadow-sm font-bold border border-border"
              : "text-text-muted hover:text-foreground"
          )}
        >
          <Building2 className="w-4 h-4 text-primary" />
          <span>Properties ({properties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all",
            activeTab === "services"
              ? "bg-card text-foreground shadow-sm font-bold border border-border"
              : "text-text-muted hover:text-foreground"
          )}
        >
          <HardHat className="w-4 h-4 text-primary" />
          <span>Services ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("projects")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all",
            activeTab === "projects"
              ? "bg-card text-foreground shadow-sm font-bold border border-border"
              : "text-text-muted hover:text-foreground"
          )}
        >
          <Briefcase className="w-4 h-4 text-primary" />
          <span>Projects ({projects.length})</span>
        </button>
      </div>

      {/* Active CRUD Section Content */}
      <div className="transition-all animate-in fade-in duration-200">
        {activeTab === "properties" && <PropertiesManager />}
        {activeTab === "services" && <ServicesManager />}
        {activeTab === "projects" && <ProjectsManager />}
      </div>
    </div>
  )
}
