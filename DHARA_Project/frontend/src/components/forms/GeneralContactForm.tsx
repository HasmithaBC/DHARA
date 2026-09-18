"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { generalContactSchema, GeneralContactFormData, normalizeSLPhone } from "@/lib/validation/leads"
import { submitLead } from "@/lib/api/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { cn } from "@/lib/utils"

interface GeneralContactFormProps {
  defaultInquiryType?: "GENERAL" | "CONSTRUCTION" | "REAL_ESTATE" | "CAREERS"
  className?: string
}

export function GeneralContactForm({
  defaultInquiryType = "GENERAL",
  className,
}: GeneralContactFormProps) {
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GeneralContactFormData>({
    resolver: zodResolver(generalContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      inquiry_type: defaultInquiryType,
      subject: "",
      message: "",
      hp_website: "",
      consent: false,
    },
  })

  const onSubmit = async (data: GeneralContactFormData) => {
    if (data.hp_website && data.hp_website.length > 0) {
      console.warn("Spam detected via honeypot")
      return
    }

    setServerError(null)
    try {
      const normalizedPhone = normalizeSLPhone(data.phone)
      const res = await submitLead({
        lead_type: "GENERAL_CONTACT",
        name: data.name,
        email: data.email,
        phone: normalizedPhone,
        message: `[Category: ${data.inquiry_type}] Subject: ${data.subject}\n\n${data.message}`,
        source_url: typeof window !== "undefined" ? window.location.href : "",
      })

      if (res.success) {
        setIsSuccess(true)
        reset()
      } else {
        setServerError("Failed to send message. Please try again or reach us by phone.")
      }
    } catch (err) {
      setServerError("An unexpected error occurred. Please try again.")
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("bg-card border border-emerald-500/30 rounded-xl p-8 sm:p-10 text-center space-y-4 shadow-sm", className)}>
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-montserrat text-2xl font-bold text-foreground">Message Dispatched</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
            Thank you for reaching out to Dhara Construction & Technology. A member of our executive team will review your inquiry and respond within 24 hours.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSuccess(false)}
          className="mt-3"
        >
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("bg-card border border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-sm", className)}
      noValidate
    >
      {serverError && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Honeypot */}
      <input
        type="text"
        {...register("hp_website")}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Row 1: Name & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Your Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-name"
            placeholder="e.g. Priyantha Silva"
            {...register("name")}
            aria-invalid={!!errors.name}
            className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-phone" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Phone / WhatsApp <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="077 123 4567"
            {...register("phone")}
            aria-invalid={!!errors.phone}
            className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      {/* Row 2: Email & Inquiry Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="contact-email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Email Address <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-email"
            type="email"
            placeholder="priyantha@example.com"
            {...register("email")}
            aria-invalid={!!errors.email}
            className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-type" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Inquiry Nature <span className="text-destructive">*</span>
          </label>
          <Select
            id="contact-type"
            {...register("inquiry_type")}
            className={cn(errors.inquiry_type && "border-destructive focus-visible:ring-destructive")}
          >
            <option value="GENERAL">General Inquiries & Head Office</option>
            <option value="CONSTRUCTION">Civil Construction & Engineering</option>
            <option value="REAL_ESTATE">Property Sales, Land & Rental</option>
            <option value="CAREERS">Careers & Subcontractor Registration</option>
          </Select>
          {errors.inquiry_type && <p className="text-xs text-destructive">{errors.inquiry_type.message}</p>}
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <label htmlFor="contact-subject" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Subject Line <span className="text-destructive">*</span>
        </label>
        <Input
          id="contact-subject"
          placeholder="e.g. Commercial Construction Consultation in Colombo 03"
          {...register("subject")}
          aria-invalid={!!errors.subject}
          className={cn(errors.subject && "border-destructive focus-visible:ring-destructive")}
        />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Detailed Message <span className="text-destructive">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={4}
          {...register("message")}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            errors.message && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder="Please describe your project scope, location, expected timeline, or property inquiry..."
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      {/* Consent Checkbox */}
      <div className="space-y-1 pt-1">
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="contact-consent"
            {...register("consent")}
            className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4 shrink-0"
          />
          <label htmlFor="contact-consent" className="text-xs text-text-muted leading-tight cursor-pointer">
            I agree to the{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>{" "}
            and grant permission to Dhara Construction & Technology to reach out regarding this inquiry. <span className="text-destructive">*</span>
          </label>
        </div>
        {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full font-semibold min-h-[48px] shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Transmitting Message...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit Corporate Inquiry
          </>
        )}
      </Button>
    </form>
  )
}
