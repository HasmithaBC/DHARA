"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { newsletterSchema, NewsletterFormData } from "@/lib/validation/leads"
import { submitLead } from "@/lib/api/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

interface NewsletterFormProps {
  className?: string
  buttonText?: string
}

export function NewsletterForm({ className, buttonText = "Subscribe" }: NewsletterFormProps) {
  const [isSuccess, setIsSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
      hp_website: "",
    },
  })

  const onSubmit = async (data: NewsletterFormData) => {
    if (data.hp_website && data.hp_website.length > 0) return

    try {
      const res = await submitLead({
        lead_type: "NEWSLETTER",
        name: "Newsletter Subscriber",
        email: data.email,
        phone: "+94000000000",
        message: "Newsletter subscription",
        source_url: typeof window !== "undefined" ? window.location.href : "",
      })

      if (res.success) {
        setIsSuccess(true)
        reset()
      }
    } catch {
      // Graceful fallback
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3", className)}>
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-semibold">Thank you for subscribing!</p>
          <p className="text-[11px] opacity-80">You will receive prime property updates & construction insights.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-2", className)} noValidate>
      <input type="text" {...register("hp_website")} className="hidden" tabIndex={-1} />
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            aria-invalid={!!errors.email}
            className={cn(
              "pl-9 bg-background/80",
              errors.email && "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="shrink-0 font-medium">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {buttonText}
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
    </form>
  )
}
