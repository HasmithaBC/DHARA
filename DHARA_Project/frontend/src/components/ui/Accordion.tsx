"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface AccordionProps {
  items: { title: string; content: React.ReactNode }[]
  className?: string
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div key={index} className="border-b border-border pb-2">
          <button
            className="flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:text-primary min-h-[44px]"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span>{item.title}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                openIndex === index && "rotate-180"
              )}
            />
          </button>
          {openIndex === index && (
            <div className="pb-4 pt-0 text-sm text-text-muted animate-in slide-in-from-top-1">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
