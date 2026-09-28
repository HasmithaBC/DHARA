"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconArrowUp, IconWhatsApp } from "@/components/icons";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94763774551";

/**
 * Site-wide floating action stack — a persistent WhatsApp shortcut (the primary
 * lead channel referenced throughout the site) plus a back-to-top control that
 * only appears once there's somewhere to scroll back to.
 */
export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex h-10 w-10 items-center justify-center border border-stone-line bg-stone-paper text-ink shadow-lg transition-colors hover:border-brass hover:text-brass-dark"
          >
            <IconArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105"
      >
        <span className="pulse-ring !border-[#25D366]" />
        <IconWhatsApp className="relative h-7 w-7" />
      </a>
    </div>
  );
}
