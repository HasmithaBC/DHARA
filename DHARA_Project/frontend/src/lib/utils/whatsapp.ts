/**
 * WhatsApp Deep-Link Builder Utility
 * Builds properly URL-encoded wa.me URLs for instant WhatsApp inquiries.
 */

const DEFAULT_PHONE = "94763774551" // Dhara official WhatsApp number

interface PropertyWhatsAppParams {
  referenceCode: string
  title: string
  priceFormatted?: string
  pageUrl?: string
  phone?: string
}

export function buildPropertyWhatsAppLink({
  referenceCode,
  title,
  priceFormatted,
  pageUrl,
  phone = DEFAULT_PHONE,
}: PropertyWhatsAppParams): string {
  const currentUrl = pageUrl || (typeof window !== "undefined" ? window.location.href : "https://dharact.com")
  const priceText = priceFormatted ? ` (${priceFormatted})` : ""
  const message = `Hi Dhara, I'm interested in ${referenceCode} — ${title}${priceText}.\nLink: ${currentUrl}`
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

interface ServiceWhatsAppParams {
  serviceTitle: string
  phone?: string
}

export function buildServiceWhatsAppLink({
  serviceTitle,
  phone = DEFAULT_PHONE,
}: ServiceWhatsAppParams): string {
  const message = `Hi Dhara, I would like to schedule an engineering consultation for: ${serviceTitle}.`
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function buildGeneralWhatsAppLink(phone = DEFAULT_PHONE): string {
  const message = `Hi Dhara Construction & Technology, I'd like to learn more about your services and available properties.`
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
