import * as React from "react"
import { cn } from "@/lib/utils"

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Can be enhanced with react-datepicker later. Using native for now.
}

export function DatePicker({ className, ...props }: DatePickerProps) {
  return (
    <input
      type="date"
      className={cn(
        "flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
