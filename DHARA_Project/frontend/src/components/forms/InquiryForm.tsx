"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Send, Loader2, MessageSquare, AlertCircle } from "lucide-react"
import { propertyInquirySchema, PropertyInquiryFormData, normalizeSLPhone } from "@/lib/validation/leads"
import { submitLead } from "@/lib/api/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

interface InquiryFormProps {
  propertyId?: string
  propertyRef?: string
  propertyTitle?: string
  listingType?: "SALE" | "RENT"
  className?: string
}

export function InquiryForm({
  propertyId,
  propertyRef,
  propertyTitle,
  listingType = "SALE",
  className,
}: InquiryFormProps) {
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInquiryFormData>({
    resolver: zodResolver(propertyInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      whatsapp_same: true,
      message: propertyRef ? `Hi, I am interested in property ${propertyRef} (${propertyTitle || ""}). Please provide further details.` : "Hi, I am interested in this listing. Please provide more details.",
      proposed_offer: undefined,
      property_id: propertyId,
      property_ref: propertyRef,
      property_title: propertyTitle,
      hp_website: "",
      consent: false,
    },
  })

  const onSubmit = async (data: PropertyInquiryFormData) => {
    // Bot honeypot verification
    if (data.hp_website && data.hp_website.length > 0) {
      console.warn("Spam detected via honeypot")
      return
    }

    setServerError(null)
    try {
      const normalizedPhone = normalizeSLPhone(data.phone)
      const res = await submitLead({
        lead_type: "PROPERTY_INQUIRY",
        name: data.name,
        email: data.email,
        phone: normalizedPhone,
        whatsapp_same_as_phone: data.whatsapp_same,
        message: data.message,
        offer_amount_lkr: data.proposed_offer || null,
        property_id: propertyId || null,
        source_url: typeof window !== "undefined" ? window.location.href : "",
      })

      if (res.success) {
        setIsSuccess(true)
        reset()
      } else {
        setServerError("Unable to send your inquiry. Please try again or reach us on WhatsApp.")
      }
    } catch (err) {
      setServerError("An unexpected error occurred. Please try again.")
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("bg-card border border-emerald-500/30 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-sm", className)}>
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-montserrat text-xl font-bold text-foreground">Inquiry Received</h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto">
            Thank you! A Dhara property advisor will review your request for{" "}
            <strong className="text-foreground">{propertyRef || "this property"}</strong> and reach out shortly.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSuccess(false)}
          className="mt-2"
        >
          Send Another Message
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
          <MessageSquare className="w-5 h-5 text-primary" />
          Inquire About This Property
        </h3>
        {propertyRef && (
          <p className="text-xs text-text-muted mt-0.5">
            Ref: <span className="font-mono font-medium text-foreground">{propertyRef}</span>
          </p>
        )}
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Honeypot field (hidden from real users) */}
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
        <label htmlFor="inquiry-name" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Full Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="inquiry-name"
          placeholder="e.g. Kasun Perera"
          {...register("name")}
          aria-invalid={!!errors.name}
          className={cn(errors.name && "border-destructive focus-visible:ring-destructive")}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Contact Grid: Phone & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label htmlFor="inquiry-phone" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Phone Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="inquiry-phone"
            type="tel"
            placeholder="077 123 4567"
            {...register("phone")}
            aria-invalid={!!errors.phone}
            className={cn(errors.phone && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="inquiry-email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Email Address <span className="text-destructive">*</span>
          </label>
          <Input
            id="inquiry-email"
            type="email"
            placeholder="kasun@example.com"
            {...register("email")}
            aria-invalid={!!errors.email}
            className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      {/* WhatsApp Same Checkbox */}
      <div className="flex items-center space-x-2 pt-0.5">
        <input
          type="checkbox"
          id="whatsapp-same"
          {...register("whatsapp_same")}
          className="rounded border-input text-primary focus:ring-primary h-4 w-4"
        />
        <label htmlFor="whatsapp-same" className="text-xs text-text-muted cursor-pointer select-none">
          This number is available on WhatsApp
        </label>
      </div>

      {/* Optional Proposed Offer (For Sale listings only) */}
      {listingType === "SALE" && (
        <div className="space-y-1.5">
          <label htmlFor="inquiry-offer" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Proposed Offer (LKR) <span className="text-text-muted font-normal lowercase">(optional)</span>
          </label>
          <Input
            id="inquiry-offer"
            type="number"
            placeholder="e.g. 45000000"
            {...register("proposed_offer", { valueAsNumber: true })}
            aria-invalid={!!errors.proposed_offer}
            className={cn(errors.proposed_offer && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.proposed_offer && <p className="text-xs text-destructive">{errors.proposed_offer.message}</p>}
        </div>
      )}

      {/* Message */}
      <div className="space-y-1.5">
        <label htmlFor="inquiry-message" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Message <span className="text-destructive">*</span>
        </label>
        <textarea
          id="inquiry-message"
          rows={3}
          {...register("message")}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            errors.message && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder="Ask a question about deed clarity, inspection timing, or payment terms..."
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      {/* Privacy Policy Consent */}
      <div className="space-y-1 pt-1">
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="inquiry-consent"
            {...register("consent")}
            className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4 shrink-0"
          />
          <label htmlFor="inquiry-consent" className="text-xs text-text-muted leading-tight cursor-pointer">
            I agree to the{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>{" "}
            and allow Dhara to process my contact information. <span className="text-destructive">*</span>
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
            Sending Inquiry...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit Property Inquiry
          </>
        )}
      </Button>
    </form>
  )
}
