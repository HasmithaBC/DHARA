import Image from "next/image";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

/**
 * Drop-in replacement for next/image's <Image fill> pattern that also understands
 * video files. Property and project galleries are just string arrays of file paths —
 * if one of those happens to be a .mp4 (or similar) it was previously being handed to
 * next/image, which silently rendered nothing/a broken image. This renders a muted,
 * looping, inline-playable <video> instead whenever the src looks like a video.
 */
export default function SmartMedia({
  src,
  alt,
  className,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (isVideoUrl(src)) {
    return (
      <video
        className={className}
        src={src}
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
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}
