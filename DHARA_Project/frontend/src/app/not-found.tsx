import Link from "next/link"
import { Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 text-center">
      <h1 className="text-6xl font-montserrat font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-montserrat font-semibold mb-6">Page Not Found</h2>
      <p className="text-text-muted mb-8 max-w-md">
        We couldn't find the page you're looking for. Try searching for a property or navigating back to our main sections.
      </p>

      {/* Basic Search Bar UI */}
      <div className="w-full max-w-md flex mb-12">
        <input 
          type="text" 
          placeholder="Search properties or services..." 
          className="flex-1 min-h-[44px] rounded-l-md border border-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button className="bg-primary text-charcoal px-4 rounded-r-md min-h-[44px] hover:bg-primary/90 flex items-center justify-center">
          <Search className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
        <Link href="/" className="min-h-[44px] flex items-center justify-center border rounded-md hover:border-primary hover:text-primary transition-colors">
          Home
        </Link>
        <Link href="/properties" className="min-h-[44px] flex items-center justify-center border rounded-md hover:border-primary hover:text-primary transition-colors">
          Properties
        </Link>
        <Link href="/services" className="min-h-[44px] flex items-center justify-center border rounded-md hover:border-primary hover:text-primary transition-colors">
          Services
        </Link>
        <Link href="/contact" className="min-h-[44px] flex items-center justify-center border rounded-md hover:border-primary hover:text-primary transition-colors">
          Contact Us
        </Link>
      </div>
    </div>
  )
}
