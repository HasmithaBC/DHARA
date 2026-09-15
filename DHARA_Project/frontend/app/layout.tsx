import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import FloatingActions from "@/components/FloatingActions";
import { CurrencyProvider } from "@/lib/currency-context";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL("https://dharact.com"),
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

// NFRSEO-004: Organization + LocalBusiness structured data, sitewide.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  name: "Dhara Construction and Technology (Pvt) Ltd",
  url: "https://dharact.com",
  telephone: "+94763774551",
  email: "kosala@dharact.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "No. 535/1B, Kakunagahalanda Waththa, Heiyanthuduwa",
    addressCountry: "LK",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body className="font-body">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <CurrencyProvider>
          <TopBar />
          <Header />
          <main>{children}</main>
          <Footer />
          <FloatingActions />
        </CurrencyProvider>
      </body>
    </html>
  );
}
