import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange, className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          <button
            className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-md px-3 hover:bg-muted disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Previous</span>
          </button>
        </li>
        <li className="text-sm font-medium mx-2">
          Page {currentPage} of {totalPages}
        </li>
        <li>
          <button
            className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-md px-3 hover:bg-muted disabled:opacity-50"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span className="sr-only sm:not-sr-only">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
