import * as React from "react"
import { cn } from "@/lib/utils"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div
        className={cn(
          "w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto",
          className
        )}
      >
        <div className="flex items-start justify-between pb-3 gap-4 border-b border-border/60 shrink-0">
          <div>
            {title && <h2 className="text-lg sm:text-xl font-montserrat font-bold text-foreground">{title}</h2>}
            {description && <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted min-h-[36px] min-w-[36px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary text-text-muted hover:text-foreground shrink-0"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1.5 pt-2 -mr-1.5 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  )
}
