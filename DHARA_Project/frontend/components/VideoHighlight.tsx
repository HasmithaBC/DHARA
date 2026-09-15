"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "@/components/motion/Reveal";
import { IconClose, IconPlay } from "@/components/icons";

/**
 * Fixes FR-HOM's "Video Highlight" block: it previously showed a static poster
 * (VideoThumbnail.webp) even though a real highlight reel (VideoHighlight.mp4)
 * ships in /public/images/home and was never wired up. This plays that file as a
 * silent, looping background — and opens it full-screen, with sound and controls,
 * in a lightbox when the play button is tapped.
 */
export default function VideoHighlight({
  videoSrc,
  posterSrc,
}: {
  videoSrc: string;
  posterSrc: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section className="relative overflow-hidden bg-concrete-900 py-0">
      <div className="stripe-band h-1.5 w-full" />
      <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[16/7]">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-concrete-900/85 via-concrete-900/40 to-concrete-900/30" />
        <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-40" />

        <div className="container-content absolute inset-0 flex flex-col items-center justify-center text-center">
          <Reveal>
            <p className="eyebrow text-brass-light">Our Work in Action</p>
            <h2 className="mt-3 font-display text-3xl text-stone-paper md:text-4xl">Built by Dhara</h2>
            <p className="mt-4 max-w-md text-sm text-stone-line">
              From tower foundations and fire installations to layered-edge residences — every project is delivered by our in-house engineering teams.
            </p>
          </Reveal>

          {/* Play control — opens the full highlight reel with sound */}
          <Reveal delay={0.15}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Play highlight reel"
              className="group relative mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-brass text-ink shadow-xl transition-transform hover:scale-105"
            >
              <span className="pulse-ring" />
              <span className="pulse-ring pulse-ring-delay" />
              <IconPlay className="relative h-6 w-6 translate-x-0.5" />
            </button>
            <p className="mt-3 text-xs uppercase tracking-widest text-stone-line">Watch the reel</p>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/projects" className="btn-brass transition-transform hover:-translate-y-0.5 hover:shadow-lg">
                Explore Portfolio
              </Link>
              <Link
                href="/contact"
                className="btn-outline border-stone-paper text-stone-paper transition-transform hover:-translate-y-0.5 hover:bg-stone-paper hover:text-ink"
              >
                Start a Project
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
      <div className="stripe-band h-1.5 w-full" />

      {/* Fullscreen lightbox with real controls + sound */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-concrete-900/95 p-4 backdrop-blur-sm sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative aspect-video w-full max-w-4xl bg-black shadow-2xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <video className="h-full w-full" src={videoSrc} controls autoPlay playsInline />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close video"
                className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center border border-stone-paper/40 text-stone-paper transition-colors hover:border-brass hover:text-brass-light"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
