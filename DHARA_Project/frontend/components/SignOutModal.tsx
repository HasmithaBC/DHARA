"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export default function SignOutModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Sign out?",
  description = "Are you sure you want to sign out? You will need to re-enter your credentials to access the admin panel.",
  confirmLabel = "Sign out",
}: SignOutModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm border border-stone-line bg-stone-paper p-6 shadow-2xl rounded-sm"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>

              <div className="flex-1">
                <h3 id="signout-modal-title" className="font-display text-base text-ink font-semibold">
                  {title}
                </h3>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-stone-line text-xs font-medium text-ink hover:bg-stone-fog transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-stone-paper text-xs font-medium transition-colors rounded-sm"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
