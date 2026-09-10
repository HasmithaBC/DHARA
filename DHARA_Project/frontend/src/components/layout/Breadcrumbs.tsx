"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumbs() {
  const pathname = usePathname()

  // Don't show breadcrumbs on the home page
  if (pathname === "/") return null

  // Split path into segments
  const segments = pathname.split("/").filter((segment) => segment !== "")

  return (
    <nav aria-label="Breadcrumb" className="w-full py-4 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto flex items-center overflow-x-auto whitespace-nowrap">
      <ol className="flex items-center space-x-2 text-sm text-text-muted">
        <li>
          <Link href="/" className="hover:text-primary transition-colors flex items-center min-h-[44px]">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`
          const isLast = index === segments.length - 1
          const title = segment.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())

          return (
            <React.Fragment key={href}>
              <li>
                <ChevronRight className="h-4 w-4 text-text-muted/50" />
              </li>
              <li>
                {isLast ? (
                  <span className="font-medium text-foreground min-h-[44px] flex items-center" aria-current="page">
                    {title}
                  </span>
                ) : (
                  <Link href={href} className="hover:text-primary transition-colors min-h-[44px] flex items-center">
                    {title}
                  </Link>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
