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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl bg-card border border-border p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95",
          className
        )}
      >
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            {title && <h2 className="text-xl font-montserrat font-bold text-foreground">{title}</h2>}
            {description && <p className="text-xs text-text-muted mt-1 leading-relaxed">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary text-text-muted hover:text-foreground shrink-0"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
