import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        {
          "border-transparent bg-primary text-charcoal hover:bg-primary/80": variant === "default",
          "border-transparent bg-charcoal text-white hover:bg-charcoal/80": variant === "secondary",
          "text-foreground": variant === "outline",
          "border-transparent bg-green-500 text-white hover:bg-green-600": variant === "success",
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600": variant === "warning",
          "border-transparent bg-red-500 text-white hover:bg-red-600": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
