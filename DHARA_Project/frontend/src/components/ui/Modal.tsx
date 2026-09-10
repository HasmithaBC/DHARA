import * as React from "react"
import { cn } from "@/lib/utils"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={cn(
          "w-full max-w-lg rounded-lg bg-background p-6 shadow-lg animate-in fade-in zoom-in-95",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-montserrat font-semibold">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
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
