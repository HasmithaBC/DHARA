import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";
import { fetchSettings } from "@/lib/api";
import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconMail,
  IconPhone,
  IconPin,
  IconPinterest,
} from "@/components/icons";

// FR-CNT-003: footer summary, quick links, contact block, newsletter, and CMS-editable
// social profile links (Facebook, LinkedIn, Instagram, Pinterest) — empty ones are hidden.
const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  pinterest: "Pinterest",
};

const SOCIAL_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  facebook: IconFacebook,
  linkedin: IconLinkedIn,
  instagram: IconInstagram,
  pinterest: IconPinterest,
};

export default async function Footer() {
  const settings = await fetchSettings();
  const contact = settings.contact ?? {
    phone: "+94763774551",
    email: "kosala@dharact.com",
    address: "No. 535/1B, Kakunagahalanda Waththa, Heiyanthuduwa, Sri Lanka",
  };
  const social = settings.social ?? {};
  const socialLinks = Object.entries(social).filter(([, url]) => !!url);

  return (
    <footer className="relative mt-24 overflow-hidden bg-concrete-900 text-stone-paper">
      <div className="stripe-band h-1.5 w-full" />
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-60" />
      <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-[0.15]" />

      <div className="container-content relative grid gap-10 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 font-display text-lg">
            <span
              className="flex h-8 w-8 items-center justify-center bg-brass text-sm font-bold text-ink"
              style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
            >
              D
            </span>
            DHARA
          </div>
          <p className="mt-3 max-w-xs text-sm text-stone-line">
            Civil engineering, architecture, construction and property development —
            concepts into creation, across Sri Lanka.
          </p>
          {socialLinks.length > 0 && (
            <ul className="mt-5 flex gap-3">
              {socialLinks.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <li key={key}>
                    <a
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={SOCIAL_LABELS[key] ?? key}
                      className="flex h-9 w-9 items-center justify-center border border-white/15 text-stone-line transition-colors hover:border-brass hover:text-brass-light"
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : (SOCIAL_LABELS[key] ?? key).slice(0, 1)}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <div className="eyebrow text-brass-light">Properties</div>
          <ul className="mt-3 space-y-2.5 text-sm text-stone-line">
            <li><Link href="/properties/lands" className="transition-colors hover:text-brass-light">Land for Sale</Link></li>
            <li><Link href="/properties/houses" className="transition-colors hover:text-brass-light">Houses for Sale</Link></li>
            <li><Link href="/properties/houses/rent" className="transition-colors hover:text-brass-light">Houses for Rent</Link></li>
            <li><Link href="/properties/commercial/rent" className="transition-colors hover:text-brass-light">Commercial for Rent</Link></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-brass-light">Company</div>
          <ul className="mt-3 space-y-2.5 text-sm text-stone-line">
            <li><Link href="/about-us" className="transition-colors hover:text-brass-light">About Us</Link></li>
            <li><Link href="/projects" className="transition-colors hover:text-brass-light">Projects</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-brass-light">Contact</Link></li>
            <li><Link href="/privacy-policy" className="transition-colors hover:text-brass-light">Privacy Policy</Link></li>
            <li><Link href="/terms" className="transition-colors hover:text-brass-light">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-brass-light">Contact</div>
          <ul className="mt-3 space-y-3 text-sm text-stone-line">
            <li className="flex items-start gap-2.5">
              <IconPin className="mt-0.5 h-4 w-4 shrink-0 text-brass-light" />
              <span>{contact.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <IconPhone className="h-4 w-4 shrink-0 text-brass-light" />
              <a href={`tel:${contact.phone}`} className="transition-colors hover:text-brass-light">{contact.phone}</a>
            </li>
            <li className="flex items-center gap-2.5">
              <IconMail className="h-4 w-4 shrink-0 text-brass-light" />
              <a href={`mailto:${contact.email}`} className="transition-colors hover:text-brass-light">{contact.email}</a>
            </li>
          </ul>
          <NewsletterForm />
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-content flex flex-col items-center justify-between gap-2 py-6 text-xs text-stone-line md:flex-row">
          <span>© {new Date().getFullYear()} Dhara Construction and Technology (Pvt) Ltd.</span>
          <span>dharact.com</span>
        </div>
      </div>
    </footer>
  );
}
