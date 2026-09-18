import { z } from "zod"

/**
 * Normalizes Sri Lankan phone numbers to E.164 (+94XXXXXXXXX)
 * Supports inputs: '0771234567', '+94771234567', '94771234567', '0112345678'
 */
export function normalizeSLPhone(phone: string): string {
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "")
  if (cleaned.startsWith("+94")) {
    return cleaned
  }
  if (cleaned.startsWith("94") && cleaned.length >= 11) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+94${cleaned.slice(1)}`
  }
  return cleaned
}

/**
 * Regular expression validating Sri Lankan landlines & mobile numbers:
 * (070, 071, 072, 074, 075, 076, 077, 078) or area landlines (011, 081, 091, etc.)
 */
const slPhoneRegex = /^(?:(?:\+94|0094|94)[0-9]{9}|0[0-9]{9})$/

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .refine(
    (val) => {
      const clean = val.replace(/[\s\-\(\)]/g, "")
      return slPhoneRegex.test(clean)
    },
    {
      message: "Please enter a valid Sri Lankan phone number (e.g. 077 123 4567 or +94 77 123 4567)",
    }
  )

// 1. Property Inquiry Form Schema
export const propertyInquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: phoneSchema,
  whatsapp_same: z.boolean(),
  message: z.string().min(5, "Message must be at least 5 characters"),
  proposed_offer: z
    .number()
    .positive("Offer amount must be greater than zero")
    .optional()
    .nullable(),
  property_id: z.string().optional(),
  property_ref: z.string().optional(),
  property_title: z.string().optional(),
  hp_website: z.string().max(0, "Bot submission detected"), // Honeypot
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Privacy Policy to submit an inquiry",
  }),
})

export type PropertyInquiryFormData = z.infer<typeof propertyInquirySchema>

// 2. Site Inspection Booking Schema
export const inspectionBookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: phoneSchema,
  inspection_date: z
    .string()
    .min(1, "Please select an inspection date")
    .refine((dateStr) => {
      const selected = new Date(dateStr)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const maxDate = new Date()
      maxDate.setDate(today.getDate() + 90)
      return selected >= today && selected <= maxDate
    }, "Date must be between today and 90 days from now"),
  inspection_slot: z.enum(["MORNING", "AFTERNOON", "EVENING"], {
    errorMap: () => ({ message: "Please select a preferred time slot" }),
  }),
  message: z.string().optional(),
  property_id: z.string().optional(),
  property_ref: z.string().optional(),
  hp_website: z.string().max(0, "Bot submission detected"), // Honeypot
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Privacy Policy",
  }),
})

export type InspectionBookingFormData = z.infer<typeof inspectionBookingSchema>

// 3. General Contact Form Schema
export const generalContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: phoneSchema,
  inquiry_type: z.enum(["GENERAL", "CONSTRUCTION", "REAL_ESTATE", "CAREERS"], {
    errorMap: () => ({ message: "Please select an inquiry type" }),
  }),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  hp_website: z.string().max(0, "Bot submission detected"), // Honeypot
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Privacy Policy",
  }),
})

export type GeneralContactFormData = z.infer<typeof generalContactSchema>

// 4. Gated Document Mini-Form Schema
export const gatedDocumentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: phoneSchema,
  document_id: z.string().min(1, "Document identifier missing"),
  property_ref: z.string().optional(),
  hp_website: z.string().max(0, "Bot submission detected"), // Honeypot
  consent: z.boolean().refine((val) => val === true, {
    message: "Consent is required to download documents",
  }),
})

export type GatedDocumentFormData = z.infer<typeof gatedDocumentSchema>

// 5. Service Consultation Booking Schema
export const serviceConsultationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: phoneSchema,
  service_slug: z.string().optional(),
  service_title: z.string().optional(),
  project_location: z.string().optional(),
  approx_budget: z.string().optional(),
  message: z.string().min(5, "Please provide some project details"),
  hp_website: z.string().max(0, "Bot submission detected"), // Honeypot
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Privacy Policy",
  }),
})

export type ServiceConsultationFormData = z.infer<typeof serviceConsultationSchema>

// 6. Newsletter Subscription Schema
export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  hp_website: z.string().max(0, "Bot submission detected"),
})

export type NewsletterFormData = z.infer<typeof newsletterSchema>
