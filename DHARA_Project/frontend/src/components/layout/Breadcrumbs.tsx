"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Custom items provided
  if (items && items.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className={cn("w-full flex items-center overflow-x-auto whitespace-nowrap text-xs sm:text-sm", className)}>
        <ol className="flex items-center space-x-2 text-inherit">
          <li>
            <Link href="/" className="hover:text-primary transition-colors flex items-center min-h-[36px] opacity-80 hover:opacity-100">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <React.Fragment key={index}>
                <li>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </li>
                <li>
                  {isLast || !item.href ? (
                    <span className="font-semibold text-primary" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    <Link href={item.href} className="hover:text-primary transition-colors opacity-80 hover:opacity-100">
                      {item.label}
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

  // Don't show automatic breadcrumbs on the home page
  if (pathname === "/") return null

  // Split path into segments
  const segments = pathname.split("/").filter((segment) => segment !== "")

  return (
    <nav aria-label="Breadcrumb" className={cn("w-full py-4 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto flex items-center overflow-x-auto whitespace-nowrap text-sm", className)}>
      <ol className="flex items-center space-x-2 text-text-muted">
        <li>
          <Link href="/" className="hover:text-primary transition-colors flex items-center min-h-[44px]">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`
          const isLast = index === segments.length - 1
          const title = segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

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
