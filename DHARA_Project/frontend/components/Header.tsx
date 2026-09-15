"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrency } from "@/lib/currency-context";

const propertyLinks = [
  { href: "/properties/lands", label: "Land for Sale" },
  { href: "/properties/houses", label: "Houses for Sale" },
  { href: "/properties/houses/rent", label: "Houses for Rent" },
  { href: "/properties/commercial/rent", label: "Commercial for Rent" },
  { href: "/properties/other", label: "Commercial & Other for Sale" },
];

const serviceLinks = [
  { href: "/services/civil-construction", label: "Civil Construction" },
  { href: "/services/tower-foundations", label: "Tower Foundations" },
  { href: "/services/architectural-design", label: "Architectural Design" },
  { href: "/services/mep", label: "MEP Systems" },
  { href: "/services/interiors", label: "Interiors & Fit-Outs" },
  { href: "/services/boq-estimation", label: "BOQ & Cost Auditing" },
  { href: "/services/3d-visualization", label: "3D Visualisation" },
];

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94763774551";

export default function Header() {
  const { currency, toggle } = useCurrency();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<"properties" | "services" | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 bg-stone-paper/95 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_16px_-4px_rgba(33,34,30,0.15)] border-b border-stone-line" : "border-b border-transparent"
      }`}
    >
      <div className={`h-[2px] w-full bg-gradient-to-r from-brass via-brass-light to-brass transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`} />
      <div className="container-content flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl tracking-tight text-ink">
          <span className="flex h-8 w-8 items-center justify-center bg-ink text-sm font-bold text-brass-light" style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}>
            D
          </span>
          DHARA
          <span className="ml-1 hidden text-xs font-body font-normal text-ink-soft sm:inline">
            Construction &amp; Technology
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-ink lg:flex">
          <Link href="/" className="transition-colors hover:text-brass-dark">Home</Link>

          <div className="group relative">
            <button className="flex items-center gap-1 transition-colors hover:text-brass-dark">
              Properties
              <svg className="h-3 w-3 transition-transform group-hover:rotate-180" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="invisible absolute left-0 top-full w-64 origin-top -translate-y-1 border border-stone-line bg-stone-paper py-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {propertyLinks.map((l) => (
                <Link key={l.href} href={l.href} className="block px-4 py-2 text-sm transition-colors hover:bg-stone-fog hover:text-brass-dark">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="group relative">
            <button className="flex items-center gap-1 transition-colors hover:text-brass-dark">
              Services
              <svg className="h-3 w-3 transition-transform group-hover:rotate-180" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="invisible absolute left-0 top-full w-64 origin-top -translate-y-1 border border-stone-line bg-stone-paper py-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {serviceLinks.map((l) => (
                <Link key={l.href} href={l.href} className="block px-4 py-2 text-sm transition-colors hover:bg-stone-fog hover:text-brass-dark">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/projects" className="transition-colors hover:text-brass-dark">Projects</Link>
          <Link href="/about-us" className="transition-colors hover:text-brass-dark">About</Link>
          <Link href="/contact" className="transition-colors hover:text-brass-dark">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="hidden border border-stone-line px-2 py-1 text-xs transition-colors hover:border-brass hover:text-brass-dark sm:inline-flex"
            title="Toggle currency (indicative only)"
          >
            {currency}
          </button>
          <Link href="/properties" className="btn-outline hidden sm:inline-flex">Properties</Link>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brass hidden sm:inline-flex"
          >
            WhatsApp
          </a>

          {/* Mobile hamburger — NFR-UI-001 */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center border border-stone-line lg:hidden"
          >
            <div className="relative h-3.5 w-4">
              <motion.span
                className="absolute left-0 top-0 h-[1.5px] w-4 bg-ink"
                animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 bg-ink"
                animate={{ opacity: open ? 0 : 1 }}
                transition={{ duration: 0.15 }}
              />
              <motion.span
                className="absolute left-0 bottom-0 h-[1.5px] w-4 bg-ink"
                animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 top-16 z-30 bg-concrete-900/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 top-16 z-30 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-stone-line bg-stone-paper lg:hidden"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <nav className="container-content flex flex-col py-4 text-ink">
                <Link href="/" onClick={() => setOpen(false)} className="border-b border-stone-line py-3 text-sm">
                  Home
                </Link>

                <button
                  className="flex items-center justify-between border-b border-stone-line py-3 text-left text-sm"
                  onClick={() => setMobileSection(mobileSection === "properties" ? null : "properties")}
                >
                  Properties
                  <svg className={`h-3 w-3 transition-transform ${mobileSection === "properties" ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <AnimatePresence>
                  {mobileSection === "properties" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {propertyLinks.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-stone-line py-3 pl-4 text-sm text-ink-soft">
                          {l.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  className="flex items-center justify-between border-b border-stone-line py-3 text-left text-sm"
                  onClick={() => setMobileSection(mobileSection === "services" ? null : "services")}
                >
                  Services
                  <svg className={`h-3 w-3 transition-transform ${mobileSection === "services" ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <AnimatePresence>
                  {mobileSection === "services" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {serviceLinks.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-stone-line py-3 pl-4 text-sm text-ink-soft">
                          {l.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Link href="/projects" onClick={() => setOpen(false)} className="border-b border-stone-line py-3 text-sm">
                  Projects
                </Link>
                <Link href="/about-us" onClick={() => setOpen(false)} className="border-b border-stone-line py-3 text-sm">
                  About
                </Link>
                <Link href="/contact" onClick={() => setOpen(false)} className="border-b border-stone-line py-3 text-sm">
                  Contact
                </Link>

                <div className="mt-4 flex gap-3">
                  <a href="tel:+94763774551" className="btn-outline flex-1 justify-center">Call</a>
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="btn-brass flex-1 justify-center">
                    WhatsApp
                  </a>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
