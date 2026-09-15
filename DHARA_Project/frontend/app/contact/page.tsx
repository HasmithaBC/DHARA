import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/motion/Reveal";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch with Dhara Construction and Technology — civil engineering, construction, architectural design, MEP and property enquiries.",
};

export default function ContactPage({ searchParams }: { searchParams: { service?: string } }) {
  return (
    <div>
      {/* Page header */}
      <div className="relative overflow-hidden border-b border-stone-line bg-concrete-900">
        <Image src="/images/ContactUs/image_banner.webp" alt="" fill className="object-cover opacity-40" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-concrete-900 via-concrete-900/70 to-concrete-900/40" />
        <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-content relative py-16">
          <p className="eyebrow fade-in-up fade-in-up-1 text-brass-light">Get in Touch</p>
          <h1 className="fade-in-up fade-in-up-2 mt-2 font-display text-3xl text-stone-paper">Contact Us</h1>
          <p className="fade-in-up fade-in-up-3 mt-3 max-w-lg text-sm text-stone-line">
            Whether you have a construction project, a property enquiry or just want to speak to our team —
            we respond to every message within one business day.
          </p>
        </div>
      </div>

      <div className="container-content py-14">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Form */}
          <Reveal>
            <ContactForm defaultService={searchParams.service} />
          </Reveal>

          {/* Contact details + map */}
          <Reveal direction="left" delay={0.1}>
            <div className="space-y-6 text-sm">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Address</div>
                  <div className="mt-2 text-ink">
                    No. 535/1B, Kakunagahalanda Waththa,<br />
                    Heiyanthuduwa, Sri Lanka
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Business Hours</div>
                  <div className="mt-2 text-ink">Monday – Saturday</div>
                  <div className="text-ink-soft">8:30 am – 5:30 pm</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Phone</div>
                  <a href="tel:+94763774551" className="mt-2 block text-ink underline decoration-brass underline-offset-4 transition-colors hover:text-brass-dark">
                    +94 76 377 4551
                  </a>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Email</div>
                  <a href="mailto:kosala@dharact.com" className="mt-2 block text-ink underline decoration-brass underline-offset-4 transition-colors hover:text-brass-dark">
                    kosala@dharact.com
                  </a>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94763774551"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-brass inline-flex gap-2 transition-transform hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.126 1.533 5.864L.057 23.285a.75.75 0 00.921.921l5.421-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 01-4.952-1.357l-.355-.21-3.676 1.001 1.001-3.676-.21-.355A9.714 9.714 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                </svg>
                Chat on WhatsApp
              </a>

              {/* Google Maps embed */}
              <div className="overflow-hidden border border-stone-line">
                <iframe
                  title="Dhara Construction and Technology — office location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3962.4!2d80.0!3d6.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2523000000000%3A0x0!2zHeiyanthuduwa%2C+Sri+Lanka!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                  width="100%"
                  height="320"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Quick links */}
              <div className="border-t border-stone-line pt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Quick Enquiries</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "Civil Construction", slug: "civil-construction" },
                    { label: "Architectural Design", slug: "architectural-design" },
                    { label: "Tower Foundations", slug: "tower-foundations" },
                    { label: "MEP Systems", slug: "mep" },
                    { label: "BOQ & Estimation", slug: "boq-estimation" },
                  ].map((s) => (
                    <a
                      key={s.slug}
                      href={`/contact?service=${s.slug}`}
                      className="border border-stone-line px-3 py-1 text-xs transition-colors hover:border-brass hover:text-brass-dark"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
