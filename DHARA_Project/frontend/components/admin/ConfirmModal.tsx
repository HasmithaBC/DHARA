"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading = false,
  isDanger = true,
}: ConfirmModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, isLoading]);

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
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm border border-stone-line bg-stone-paper p-6 shadow-2xl rounded-sm"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                  isDanger
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                {isDanger ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>

              <div className="flex-1">
                <h3 id="confirm-modal-title" className="font-display text-base text-ink font-semibold">
                  {title}
                </h3>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="px-3.5 py-1.5 border border-stone-line text-xs font-medium text-ink hover:bg-stone-fog transition-colors rounded-sm disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className={`px-4 py-1.5 text-stone-paper text-xs font-medium transition-colors rounded-sm inline-flex items-center gap-1.5 ${
                  isDanger
                    ? "bg-red-700 hover:bg-red-800 disabled:bg-red-400"
                    : "bg-ink hover:bg-concrete-900 disabled:bg-stone-line"
                }`}
              >
                {isLoading && (
                  <svg className="animate-spin h-3.5 w-3.5 text-stone-paper" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
