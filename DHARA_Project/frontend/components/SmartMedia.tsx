import Image from "next/image";
import { isUploadedMedia, mediaUrl } from "@/lib/media";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

/**
 * Drop-in replacement for next/image's <Image fill> that
 *  - understands video files (renders a muted, looping <video>),
 *  - resolves uploaded "/uploads/..." paths to the API that serves them,
 *  - skips next/image's optimiser for uploaded files (the Next server may not be able to reach the API),
 *  - renders a neutral placeholder instead of crashing when no image has been set yet.
 * The parent element must be positioned (relative) — same requirement as <Image fill>.
 */
export default function SmartMedia({
  src,
  alt,
  className,
  priority,
  sizes,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!src) {
    return <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-stone-fog to-stone-line" />;
  }

  const url = mediaUrl(src);

  if (isVideoUrl(url)) {
    return (
      <video
        className={className}
        src={url}
        autoPlay
        muted
        loop
        playsInline
        controls
        aria-label={alt}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      unoptimized={isUploadedMedia(src)}
    />
  );
}
