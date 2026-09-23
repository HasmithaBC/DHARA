"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AdminStoreProvider, useAdminStore } from "@/lib/store/adminStore"
import {
  LayoutDashboard,
  Building2,
  HardHat,
  Briefcase,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Menu,
  X,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminStoreProvider>
      <AdminShell>{children}</AdminShell>
    </AdminStoreProvider>
  )
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { properties, services, projects, resetToDefaults } = useAdminStore()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  // Navigation Items
  const NAV_ITEMS = [
    {
      name: "Dashboard Overview",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Properties",
      href: "/admin/properties",
      icon: Building2,
      count: properties.length,
    },
    {
      name: "Services",
      href: "/admin/services",
      icon: HardHat,
      count: services.length,
    },
    {
      name: "Projects",
      href: "/admin/projects",
      icon: Briefcase,
      count: projects.length,
    },
  ]

  const handleResetData = () => {
    if (confirm("Reset all Properties, Services, and Projects to original system defaults?")) {
      resetToDefaults()
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30 text-foreground">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-charcoal text-white flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto shadow-2xl border-r border-white/10",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link href="/admin" className="flex items-center space-x-3 group">
              <Image
                src="/images/brand/logo.svg"
                alt="Dhara Admin Logo"
                width={36}
                height={36}
                className="w-8 h-8 object-contain"
              />
              <div>
                <span className="font-montserrat font-bold text-sm tracking-wider uppercase text-white block">
                  DHARA
                </span>
                <span className="text-[10px] text-primary font-semibold tracking-widest uppercase block">
                  Admin Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 px-3 block mb-2">
              CRUD Management
            </span>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                    isActive
                      ? "bg-primary text-charcoal shadow-md shadow-primary/20 font-bold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isActive ? "text-charcoal" : "text-primary")} />
                    <span>{item.name}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full font-mono text-[10px]",
                        isActive ? "bg-charcoal text-white" : "bg-white/10 text-white/80"
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10 space-y-2 bg-charcoal-light/40">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
                <span>View Public Site</span>
              </span>
              <span className="text-[10px] text-white/50">↗</span>
            </Link>

            <button
              onClick={handleResetData}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-amber-400/90 hover:bg-amber-400/10 transition-colors"
              title="Reset all store records to mock defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border px-4 sm:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted">
              <span className="font-semibold text-foreground">Admin Portal</span>
              <span>/</span>
              <span className="capitalize font-medium text-primary">
                {pathname === "/admin" ? "Overview Dashboard" : pathname.replace("/admin/", "")}
              </span>
            </div>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
