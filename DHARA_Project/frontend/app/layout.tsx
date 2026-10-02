import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import FloatingActions from "@/components/FloatingActions";
import { CurrencyProvider } from "@/lib/currency-context";
import { getContact } from "@/lib/contact";
import { fetchServices } from "@/lib/api";

// Never prerender at build time: every page reads live content from the API, so what an admin saves
// is what the next visitor sees (no stale HTML, and `next build` doesn't need the backend running).
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dharact.com";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dhara Construction and Technology | Build, Develop, Invest",
    template: "%s | Dhara Construction and Technology",
  },
  description:
    "Dhara Construction and Technology — civil engineering, architecture, MEP and interiors, plus land, house and commercial listings for sale and rent across Sri Lanka.",
  openGraph: {
    type: "website",
    siteName: "Dhara Construction and Technology",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [contact, services] = await Promise.all([getContact(), fetchServices().catch(() => [])]);
  // NFRSEO-004: Organization + LocalBusiness structured data, sitewide (contact details come from Admin → Settings).
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: "Dhara Construction and Technology (Pvt) Ltd",
    url: SITE_URL,
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressCountry: "LK",
    },
  };
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body className="font-body">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <CurrencyProvider>
          <TopBar />
          <Header whatsapp={contact.whatsapp} telHref={contact.telHref} services={services} />
          <main>{children}</main>
          <Footer />
          <FloatingActions whatsapp={contact.whatsapp} />
        </CurrencyProvider>
      </body>
    </html>
  );
}
