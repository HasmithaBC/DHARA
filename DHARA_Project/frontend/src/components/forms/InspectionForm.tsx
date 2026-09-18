"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, CheckCircle2, Clock, Loader2, AlertCircle, Sun, CloudSun, Sunset } from "lucide-react"
import { inspectionBookingSchema, InspectionBookingFormData, normalizeSLPhone } from "@/lib/validation/leads"
import { submitLead } from "@/lib/api/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { DatePicker } from "@/components/ui/DatePicker"
import { cn } from "@/lib/utils"

interface InspectionFormProps {
  propertyId?: string
  propertyRef?: string
  propertyTitle?: string
  className?: string
}

export function InspectionForm({
  propertyId,
  propertyRef,
  propertyTitle,
  className,
}: InspectionFormProps) {
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  // Calculate min (today) and max (+90 days) dates in YYYY-MM-DD
  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], [])
  const maxDateStr = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 90)
    return d.toISOString().split("T")[0]
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InspectionBookingFormData>({
    resolver: zodResolver(inspectionBookingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      inspection_date: "",
      inspection_slot: "MORNING",
      message: "",
      property_id: propertyId,
      property_ref: propertyRef,
      hp_website: "",
      consent: false,
    },
  })

  const selectedSlot = watch("inspection_slot")

  const onSubmit = async (data: InspectionBookingFormData) => {
    if (data.hp_website && data.hp_website.length > 0) {
      console.warn("Spam detected via honeypot")
      return
    }

    setServerError(null)
    try {
      const normalizedPhone = normalizeSLPhone(data.phone)
      const res = await submitLead({
        lead_type: "SITE_INSPECTION",
        name: data.name,
        email: data.email,
        phone: normalizedPhone,
        preferred_inspection_date: data.inspection_date,
        preferred_inspection_slot: data.inspection_slot,
        message: data.message || `Site inspection requested for ${data.inspection_date} (${data.inspection_slot})`,
        property_id: propertyId || null,
        source_url: typeof window !== "undefined" ? window.location.href : "",
      })

      if (res.success) {
        setIsSuccess(true)
        reset()
      } else {
        setServerError("Unable to schedule site inspection. Please try again.")
      }
    } catch (err) {
      setServerError("An error occurred while booking. Please try again.")
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("bg-card border border-emerald-500/30 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-sm", className)}>
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-montserrat text-xl font-bold text-foreground">Inspection Request Confirmed</h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto">
            Our site agent will confirm the access coordination for{" "}
            <strong className="text-foreground">{propertyRef || "this property"}</strong> with you shortly via phone or WhatsApp.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSuccess(false)}
          className="mt-2"
        >
          Book Another Date
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("bg-card border border-border rounded-xl p-5 sm:p-7 space-y-4 shadow-sm", className)}
      noValidate
    >
      <div className="border-b border-border/60 pb-3">
        <h3 className="font-montserrat font-bold text-lg text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Book a Guided Site Inspection
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          Choose a preferred date and time slot. We will arrange escorted site access.
        </p>
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Honeypot field */}
      <input
        type="text"
        {...register("hp_website")}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Full Name */}
      <div className="space-y-1.5">
        <label htmlFor="inspect-name" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Full Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="inspect-name"
          placeholder="e.g. Dr. Rohan Jayawardena"
          {...register("name")}
          aria-invalid={!!errors.name}
          className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Contact Grid: Phone & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label htmlFor="inspect-phone" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Phone Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="inspect-phone"
            type="tel"
            placeholder="077 123 4567"
            {...register("phone")}
            aria-invalid={!!errors.phone}
            className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="inspect-email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Email Address <span className="text-destructive">*</span>
          </label>
          <Input
            id="inspect-email"
            type="email"
            placeholder="rohan@example.com"
            {...register("email")}
            aria-invalid={!!errors.email}
            className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      {/* Date Picker */}
      <div className="space-y-1.5">
        <label htmlFor="inspect-date" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Preferred Date <span className="text-destructive">*</span>
        </label>
        <DatePicker
          id="inspect-date"
          min={todayStr}
          max={maxDateStr}
          {...register("inspection_date")}
          aria-invalid={!!errors.inspection_date}
          className={cn(errors.inspection_date && "border-destructive focus-visible:ring-destructive")}
        />
        {errors.inspection_date && <p className="text-xs text-destructive">{errors.inspection_date.message}</p>}
      </div>

      {/* Slot Selection Buttons */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Preferred Time Slot <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "MORNING", label: "Morning", sub: "9 AM – 12 PM", icon: Sun },
            { id: "AFTERNOON", label: "Afternoon", sub: "12 PM – 3 PM", icon: CloudSun },
            { id: "EVENING", label: "Evening", sub: "3 PM – 6 PM", icon: Sunset },
          ].map((slot) => {
            const Icon = slot.icon
            const isSelected = selectedSlot === slot.id
            return (
              <button
                type="button"
                key={slot.id}
                onClick={() => setValue("inspection_slot", slot.id as any, { shouldValidate: true })}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all min-h-[58px]",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-medium shadow-sm"
                    : "border-input hover:border-primary/50 text-foreground/80 hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-4 h-4 mb-1", isSelected ? "text-primary" : "text-text-muted")} />
                <span className="text-xs font-semibold">{slot.label}</span>
                <span className="text-[10px] text-text-muted leading-tight">{slot.sub}</span>
              </button>
            )
          })}
        </div>
        {errors.inspection_slot && <p className="text-xs text-destructive">{errors.inspection_slot.message}</p>}
      </div>

      {/* Additional Notes */}
      <div className="space-y-1.5">
        <label htmlFor="inspect-notes" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Specific Requests or Questions <span className="text-text-muted font-normal lowercase">(optional)</span>
        </label>
        <textarea
          id="inspect-notes"
          rows={2}
          {...register("message")}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="e.g. Will require boundary demarcation review with the surveyor..."
        />
      </div>

      {/* Privacy Consent */}
      <div className="space-y-1 pt-1">
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="inspect-consent"
            {...register("consent")}
            className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4 shrink-0"
          />
          <label htmlFor="inspect-consent" className="text-xs text-text-muted leading-tight cursor-pointer">
            I agree to the{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>{" "}
            and authorize site visit coordination. <span className="text-destructive">*</span>
          </label>
        </div>
        {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full font-semibold min-h-[48px] shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Scheduling Inspection...
          </>
        ) : (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Confirm Inspection Request
          </>
        )}
      </Button>
    </form>
  )
}
