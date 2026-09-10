"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Phone, Mail } from "lucide-react"

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
)

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
)

export function Footer() {
  return (
    <footer className="bg-charcoal text-offwhite pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/10 pb-12">
        {/* Company Summary */}
        <div className="space-y-4">
          <Link href="/" className="inline-block">
            <Image 
              src="/images/brand/logo-white.png" 
              alt="Dhara Construction & Technology" 
              width={160} 
              height={50} 
              className="object-contain w-auto h-12"
            />
          </Link>
          <p className="text-sm text-white/60 leading-relaxed mt-4">
            Concepts Into Creation. Delivering premium architectural, construction, and real estate solutions across Sri Lanka since 2007.
          </p>
          {/* Social Links */}
          <div className="flex space-x-4 pt-2">
            <a href="#" aria-label="Facebook" className="hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <LinkedinIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-montserrat font-semibold text-lg mb-6">Quick Links</h3>
          <ul className="space-y-3">
            <li><Link href="/about-us" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">About Us</Link></li>
            <li><Link href="/services" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">Our Services</Link></li>
            <li><Link href="/projects" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">Project Portfolio</Link></li>
            <li><Link href="/insights" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">Insights</Link></li>
            <li><Link href="/contact" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">Contact Us</Link></li>
          </ul>
        </div>

        {/* Property Links */}
        <div>
          <h3 className="font-montserrat font-semibold text-lg mb-6">Properties</h3>
          <ul className="space-y-3">
            <li><Link href="/properties/lands" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">Lands for Sale</Link></li>
            <li><Link href="/properties/houses" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">Houses for Sale</Link></li>
            <li><Link href="/properties/houses/rent" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">Houses for Rent</Link></li>
            <li><Link href="/properties/commercial/rent" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">Commercial Rentals</Link></li>
            <li><Link href="/properties" className="text-white/60 hover:text-primary transition-colors text-sm min-h-[44px] flex items-center">View All Properties</Link></li>
          </ul>
        </div>

        {/* Contact Block & Newsletter */}
        <div className="space-y-6">
          <div>
            <h3 className="font-montserrat font-semibold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-sm text-white/60">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span>No. 535/1B, Kakunagahalanda Waththa,<br/>Heiyanthuduwa, Sri Lanka</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-white/60">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <a href="tel:+94763774551" className="hover:text-primary transition-colors min-h-[44px] flex items-center">+94 76 377 4551</a>
              </li>
              <li className="flex items-center space-x-3 text-sm text-white/60">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <a href="mailto:kosala@dharact.com" className="hover:text-primary transition-colors min-h-[44px] flex items-center">kosala@dharact.com</a>
              </li>
            </ul>
          </div>
          
          <div className="pt-4">
            <h4 className="text-sm font-semibold mb-3">Subscribe to our Newsletter</h4>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-white/10 border-none px-4 py-2 text-sm rounded-l-md w-full focus:outline-none focus:ring-1 focus:ring-primary text-white"
                required
              />
              <button 
                type="submit"
                className="bg-primary text-charcoal px-4 py-2 rounded-r-md text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 mt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/40">
        <p>&copy; {new Date().getFullYear()} Dhara Construction & Technology (Pvt) Ltd. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link href="/privacy-policy" className="hover:text-white transition-colors min-h-[44px] flex items-center">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors min-h-[44px] flex items-center">Terms of Service</Link>
        </div>
      </div>
    </footer>
  )
}
