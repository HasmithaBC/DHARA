"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrency } from "@/lib/currency-context";
import { clearTokens, getRole } from "@/lib/admin-api";
import { homeForRole } from "@/lib/admin-guard";
import { useRouter } from "next/navigation";

const propertyLinks = [
  { href: "/properties?category=LAND", label: "Lands" },
  { href: "/properties?category=HOUSE", label: "Houses" },
  { href: "/properties?category=COMMERCIAL", label: "Commercial" },
  { href: "/properties?category=OTHER", label: "Other" },
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
  const router = useRouter();
  const { currency, toggle } = useCurrency();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<"properties" | "services" | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("/admin/dashboard");

  useEffect(() => {
    // Check auth state when the dropdown is opened
    if (profileOpen) {
      const token = localStorage.getItem("dhara_access_token");
      setIsLoggedIn(!!token);
      if (token) {
        setDashboardUrl(homeForRole(getRole()));
      }
    }
  }, [profileOpen]);

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
          <Image src="/images/home/logo.svg" alt="Dhara Logo" width={48} height={48} className="w-auto h-10 object-contain" />
          <span className="ml-1 hidden text-xs font-body font-normal text-ink-soft sm:inline leading-tight uppercase tracking-widest">
            Construction &amp;<br />Technology
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
                <a key={l.href} href={l.href} className="block px-4 py-2 text-sm transition-colors hover:bg-stone-fog hover:text-brass-dark">
                  {l.label}
                </a>
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

        <div className="flex items-center gap-5">
          <button
            onClick={toggle}
            className="hidden border border-stone-line px-2 py-1 text-xs transition-colors hover:border-brass hover:text-brass-dark sm:inline-flex"
            title="Toggle currency (indicative only)"
          >
            {currency}
          </button>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brass hidden sm:inline-flex"
          >
            WhatsApp
          </a>

          <div className="relative hidden sm:block">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-line bg-stone-paper text-ink transition-colors hover:bg-stone-fog"
              aria-label="User Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="5" />
              </svg>
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 border border-stone-line bg-stone-paper py-2 shadow-lg rounded-md"
                >
                  {isLoggedIn ? (
                    <>
                      <Link href={dashboardUrl} className="block px-4 py-2 text-sm transition-colors hover:bg-stone-fog hover:text-brass-dark" onClick={() => setProfileOpen(false)}>
                        Dashboard
                      </Link>
                      <button onClick={() => { 
                        clearTokens(); 
                        setIsLoggedIn(false); 
                        setProfileOpen(false); 
                        router.push('/admin');
                        router.refresh();
                      }} className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-stone-fog hover:text-brass-dark">
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link href="/admin" className="block px-4 py-2 text-sm transition-colors hover:bg-stone-fog hover:text-brass-dark" onClick={() => setProfileOpen(false)}>
                      Login
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                        <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-stone-line py-3 pl-4 text-sm text-ink-soft">
                          {l.label}
                        </a>
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
