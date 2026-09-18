"use client"

import * as React from "react"
import Image from "next/image"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
  aspectRatio?: string
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before / Raw Site",
  afterLabel = "After / Completed Handover",
  className,
  aspectRatio = "aspect-[16/9]",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = React.useState(50)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMove = React.useCallback(
    (clientX: number) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPosition(percentage)
    },
    []
  )

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX)
    }
  }

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX)
      }
    }
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove)
      window.addEventListener("mouseup", handleGlobalMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDragging, handleMove])

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPosition((prev) => Math.max(0, prev - 5))
    } else if (e.key === "ArrowRight") {
      setSliderPosition((prev) => Math.min(100, prev + 5))
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="slider"
      aria-label="Before and after project comparison slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={handleKeyDown}
      onTouchMove={handleTouchMove}
      className={cn(
        "relative overflow-hidden rounded-2xl select-none cursor-ew-resize border border-border shadow-lg bg-charcoal focus:outline-none focus:ring-2 focus:ring-primary",
        aspectRatio,
        className
      )}
    >
      {/* Background Image: AFTER */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt={afterLabel}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
        />
        <div className="absolute bottom-4 right-4 bg-charcoal/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/20">
          {afterLabel}
        </div>
      </div>

      {/* Foreground Image: BEFORE (Clipped by slider position) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <div className="relative w-full h-full" style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%" }}>
          <Image
            src={beforeImage}
            alt={beforeLabel}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
          />
        </div>
        <div className="absolute bottom-4 left-4 bg-charcoal/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/20">
          {beforeLabel}
        </div>
      </div>

      {/* Divider Bar & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={() => setIsDragging(true)}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-charcoal shadow-xl border-2 border-primary flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
        >
          <GripVertical className="w-4 h-4 text-charcoal" />
        </div>
      </div>
    </div>
  )
}
