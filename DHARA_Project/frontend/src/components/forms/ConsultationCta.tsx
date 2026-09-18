"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HardHat, Compass, MessageCircle, Send, CheckCircle2, Loader2, Sparkles, Phone } from "lucide-react"
import { serviceConsultationSchema, ServiceConsultationFormData, normalizeSLPhone } from "@/lib/validation/leads"
import { submitLead } from "@/lib/api/client"
import { buildServiceWhatsAppLink } from "@/lib/utils/whatsapp"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { cn } from "@/lib/utils"

interface ConsultationCtaProps {
  variant?: "land-cross-sell" | "service-detail" | "general"
  propertyRef?: string
  propertyTitle?: string
  serviceSlug?: string
  serviceTitle?: string
  className?: string
}

export function ConsultationCta({
  variant = "general",
  propertyRef,
  propertyTitle,
  serviceSlug,
  serviceTitle,
  className,
}: ConsultationCtaProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceConsultationFormData>({
    resolver: zodResolver(serviceConsultationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      service_slug: serviceSlug,
      service_title: serviceTitle || (propertyRef ? `Custom Home Construction on ${propertyRef}` : "General Engineering Consultation"),
      project_location: "",
      approx_budget: "",
      message: propertyRef
        ? `I am interested in designing and constructing a custom home on land plot ${propertyRef} (${propertyTitle || ""}).`
        : serviceTitle
        ? `I would like to schedule an engineering consultation regarding ${serviceTitle}.`
        : "I would like to discuss a construction / architectural project.",
      hp_website: "",
      consent: false,
    },
  })

  const onSubmit = async (data: ServiceConsultationFormData) => {
    if (data.hp_website && data.hp_website.length > 0) return

    try {
      const normalizedPhone = normalizeSLPhone(data.phone)
      const res = await submitLead({
        lead_type: "SERVICE_CONSULTATION",
        name: data.name,
        email: data.email,
        phone: normalizedPhone,
        message: `[Service: ${data.service_title || "General"}] [Location: ${data.project_location || "N/A"}] [Budget: ${data.approx_budget || "N/A"}]\n\n${data.message}`,
        source_url: typeof window !== "undefined" ? window.location.href : "",
      })

      if (res.success) {
        setIsSuccess(true)
        reset()
      }
    } catch {
      // Handle error
    }
  }

  const whatsappUrl = buildServiceWhatsAppLink({
    serviceTitle: serviceTitle || (propertyRef ? `Custom Build on ${propertyRef}` : "Civil Construction"),
  })

  return (
    <>
      {variant === "land-cross-sell" ? (
        <div className={cn("relative overflow-hidden rounded-2xl bg-charcoal text-offwhite p-6 sm:p-8 border border-primary/30 shadow-xl", className)}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Turnkey Architecture & Construction</span>
              </div>
              <h3 className="font-montserrat text-xl sm:text-2xl font-bold text-white">
                Want Dhara to design & build on this land?
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Unlock seamless end-to-end realization. From chartered architectural blueprints and soil testing to CIDA-certified turnkey civil construction.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
              <Button
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="font-semibold shadow-lg shadow-primary/20"
              >
                <Compass className="w-4 h-4 mr-2" />
                Book Free Consultation
              </Button>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 w-full">
                  <MessageCircle className="w-4 h-4 mr-2 text-primary" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn("rounded-2xl bg-gradient-to-br from-charcoal to-charcoal-light text-offwhite p-8 sm:p-10 border border-border shadow-xl text-center space-y-6", className)}>
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 text-primary mb-1">
            <HardHat className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-2xl mx-auto">
            <h3 className="font-montserrat text-2xl sm:text-3xl font-bold text-white">
              Ready to Realize Your Engineering Vision?
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              Schedule an in-depth technical consultation with our chartered structural engineers and project directors.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className="font-semibold shadow-lg shadow-primary/20 min-h-[48px]"
            >
              <Compass className="w-5 h-5 mr-2" />
              Schedule Engineering Consultation
            </Button>
            <a href="tel:+94763774551">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 min-h-[48px]">
                <Phone className="w-5 h-5 mr-2" />
                Call +94 76 377 4551
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setIsSuccess(false)
        }}
        title="Schedule Engineering Consultation"
        description="Connect directly with our senior chartered engineers and quantity surveyors."
      >
        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-montserrat text-xl font-bold text-foreground">Consultation Requested</h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                Thank you! Our engineering directorship will review your project brief and contact you within 24 hours.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setIsSuccess(false)
              }}
              className="mt-2"
            >
              Close Window
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 pt-2" noValidate>
            <input type="text" {...register("hp_website")} className="hidden" tabIndex={-1} />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Your Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Eng. Sunil Ranasinghe"
                {...register("name")}
                aria-invalid={!!errors.name}
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Phone / WhatsApp <span className="text-destructive">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="077 123 4567"
                  {...register("phone")}
                  aria-invalid={!!errors.phone}
                  className={cn(errors.phone && "border-destructive")}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="sunil@example.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  className={cn(errors.email && "border-destructive")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Project Location <span className="text-text-muted font-normal lowercase">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. Colombo 07 / Kandy"
                  {...register("project_location")}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Estimated Budget <span className="text-text-muted font-normal lowercase">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. 50M LKR / Open"
                  {...register("approx_budget")}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Project Scope & Requirements <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                {...register("message")}
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.message && "border-destructive"
                )}
                placeholder="Briefly describe your land dimensions, building type, required timeline, or structural challenge..."
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="consult-consent"
                  {...register("consent")}
                  className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4 shrink-0"
                />
                <label htmlFor="consult-consent" className="text-xs text-text-muted leading-tight cursor-pointer">
                  I agree to the{" "}
                  <Link href="/privacy-policy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>{" "}
                  and authorize contact for project appraisal. <span className="text-destructive">*</span>
                </label>
              </div>
              {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Request Consultation
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
