"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Phone, MessageCircle, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const MAIN_NAV = [
  { name: "Home", href: "/" },
  { name: "Properties", href: "/properties" },
  { name: "Services", href: "/services" },
  { name: "Projects", href: "/projects" },
  { name: "About", href: "/about-us" },
  { name: "Contact", href: "/contact" },
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 min-h-[44px] group">
          <Image 
            src="/images/brand/logo.svg" 
            alt="Dhara Logo" 
            width={48} 
            height={48} 
            className="object-contain w-auto h-10"
          />
          <div className="flex flex-col justify-center">
            <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-foreground leading-tight hidden sm:block">
              Construction &<br />Technology
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "min-h-[44px] flex items-center px-3 lg:px-4 text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                  ? "text-primary"
                  : "text-foreground/80"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Actions (Desktop) */}
        <div className="hidden md:flex items-center space-x-2">
          <a
            href="tel:+94763774551"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-muted text-foreground transition-colors"
            aria-label="Call Us"
          >
            <Phone className="h-5 w-5" />
          </a>
          <a
            href="https://wa.me/94763774551"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-green-50 text-green-600 transition-colors"
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-40 bg-background md:hidden animate-in slide-in-from-right-full duration-300">
          <nav className="flex flex-col h-full overflow-y-auto pb-32">
            <ul className="flex flex-col py-4 px-4 space-y-1">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-[56px] items-center text-lg font-medium border-b border-border/50",
                      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Pinned Contact Actions in Mobile Drawer Footer */}
            <div className="mt-auto px-4 py-6 bg-muted/30">
              <p className="text-sm text-text-muted mb-4 font-medium uppercase tracking-wider">Contact Us</p>
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="tel:+94763774551"
                  className="flex flex-col items-center justify-center min-h-[88px] bg-white rounded-lg border shadow-sm"
                >
                  <Phone className="h-6 w-6 mb-2 text-foreground" />
                  <span className="text-sm font-medium">Call</span>
                </a>
                <a
                  href="https://wa.me/94763774551"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center min-h-[88px] bg-green-50 rounded-lg border border-green-100 shadow-sm"
                >
                  <MessageCircle className="h-6 w-6 mb-2 text-green-600" />
                  <span className="text-sm font-medium text-green-700">WhatsApp</span>
                </a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
