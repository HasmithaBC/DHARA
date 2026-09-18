"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Download, FileText, Lock, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { gatedDocumentSchema, GatedDocumentFormData, normalizeSLPhone } from "@/lib/validation/leads"
import { submitLead } from "@/lib/api/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { cn } from "@/lib/utils"

interface GatedDocumentFormProps {
  documentId: string
  documentTitle: string
  documentFileUrl?: string
  propertyRef?: string
  isOpen: boolean
  onClose: () => void
}

export function GatedDocumentForm({
  documentId,
  documentTitle,
  documentFileUrl = "#",
  propertyRef,
  isOpen,
  onClose,
}: GatedDocumentFormProps) {
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GatedDocumentFormData>({
    resolver: zodResolver(gatedDocumentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document_id: documentId,
      property_ref: propertyRef,
      hp_website: "",
      consent: false,
    },
  })

  // Update document_id if changed
  React.useEffect(() => {
    reset({
      name: "",
      email: "",
      phone: "",
      document_id: documentId,
      property_ref: propertyRef,
      hp_website: "",
      consent: false,
    })
    setIsSuccess(false)
    setServerError(null)
  }, [documentId, propertyRef, reset])

  const onSubmit = async (data: GatedDocumentFormData) => {
    if (data.hp_website && data.hp_website.length > 0) return

    setServerError(null)
    try {
      const normalizedPhone = normalizeSLPhone(data.phone)
      const res = await submitLead({
        lead_type: "DOCUMENT_DOWNLOAD",
        name: data.name,
        email: data.email,
        phone: normalizedPhone,
        message: `Requested Gated Document: [${data.document_id}] ${documentTitle} (Ref: ${propertyRef || "N/A"})`,
        source_url: typeof window !== "undefined" ? window.location.href : "",
      })

      if (res.success) {
        setIsSuccess(true)
      } else {
        setServerError("Failed to verify access. Please try again.")
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuccess ? "Document Access Granted" : "Unlock Verified Document"}
      description={
        isSuccess
          ? `You have unlocked ${documentTitle}.`
          : `Please provide your contact details to access ${documentTitle}.`
      }
    >
      {isSuccess ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">{documentTitle}</p>
            <p className="text-xs text-text-muted mt-1">
              Your download link is ready. A copy has also been sent to your email.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <a
              href={documentFileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download File Now
              </Button>
            </a>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2" noValidate>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/60 border border-border/80">
            <div className="p-2 rounded bg-primary/10 text-primary shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{documentTitle}</p>
              {propertyRef && <p className="text-[11px] text-text-muted font-mono">{propertyRef}</p>}
            </div>
          </div>

          {serverError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <input type="text" {...register("hp_website")} className="hidden" tabIndex={-1} />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Kasun Silva"
              {...register("name")}
              aria-invalid={!!errors.name}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Phone Number <span className="text-destructive">*</span>
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
                placeholder="kasun@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
                className={cn(errors.email && "border-destructive")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="gated-consent"
                {...register("consent")}
                className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4 shrink-0"
              />
              <label htmlFor="gated-consent" className="text-xs text-text-muted leading-tight cursor-pointer">
                I agree to receive the document and authorize follow-up under the{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
                . <span className="text-destructive">*</span>
              </label>
            </div>
            {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Unlock Document
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
