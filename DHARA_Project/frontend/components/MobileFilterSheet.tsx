"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

/**
 * Wraps the (server-rendered) filter form. On desktop it renders the form inline as a
 * sticky rail. On mobile it hides the form behind a "Filters (N)" trigger button and
 * reveals it in an animated bottom sheet with an Apply action — NFR-UI-006.
 */
export default function MobileFilterSheet({
  children,
  activeCount,
  resultCount,
}: {
  children: ReactNode;
  activeCount: number;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 border border-stone-line bg-stone-paper px-4 py-3 text-sm font-medium text-ink lg:hidden"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Filters {activeCount > 0 ? `(${activeCount})` : ""}
      </button>

      {/* Desktop inline rail */}
      <div className="hidden lg:block">{children}</div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-concrete-900/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-stone-line bg-stone-paper lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-line bg-stone-paper px-5 py-4">
                <span className="font-display text-lg text-ink">Filters</span>
                <button aria-label="Close filters" onClick={() => setOpen(false)} className="h-8 w-8 text-ink-soft">
                  ✕
                </button>
              </div>
              <div className="px-5 py-4" onClick={(e) => {
                // Applying (form submit) navigates away and unmounts this sheet automatically.
                const target = e.target as HTMLElement;
                if (target.tagName === "BUTTON" && target.getAttribute("type") === "submit") {
                  setOpen(false);
                }
              }}>
                {children}
              </div>
              <div className="sticky bottom-0 border-t border-stone-line bg-stone-paper px-5 py-3 text-center text-xs text-ink-soft">
                {resultCount} properties match
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
