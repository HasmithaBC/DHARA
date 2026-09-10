"use client"

import * as React from "react"
import { cn } from "@/lib/utils"


export function Toast({ message, type = "info", onClose }: { message: string, type?: "info" | "success" | "error", onClose: () => void }) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center justify-between rounded-lg p-4 shadow-lg min-w-[300px] animate-in slide-in-from-bottom-5",
        {
          "bg-white border text-charcoal": type === "info",
          "bg-green-500 text-white": type === "success",
          "bg-red-500 text-white": type === "error",
        }
      )}
    >
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-4 rounded-full p-1 opacity-70 hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  )
}

// Minimal Toast Provider context (to be expanded if needed)
interface ToastContextValue {
  showToast: (message: string, type?: "info" | "success" | "error") => void
}
export const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<{ message: string, type?: "info" | "success" | "error" } | null>(null)

  const showToast = (message: string, type: "info" | "success" | "error" = "info") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </ToastContext.Provider>
  )
}
