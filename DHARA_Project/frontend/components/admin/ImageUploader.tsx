"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { uploadMedia } from "@/lib/admin-api";
import { useToast } from "@/components/Toast";

interface SingleImageUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  helpText?: string;
  className?: string;
  folder?: string;
}

export function SingleImageUploader({
  label = "Image",
  value,
  onChange,
  required = false,
  helpText,
  className = "",
  folder,
}: SingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      setError("Image file exceeds the 10MB size limit.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const res = await uploadMedia(file, undefined, folder);
      onChange(res.url);
      toast.success("Image uploaded successfully.");
    } catch (err: any) {
      const msg = err.message || "Image upload failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}

      {value ? (
        <div className="relative group border border-stone-line bg-stone-paper overflow-hidden rounded-sm p-2 flex items-center gap-3">
          <div className="relative h-20 w-28 shrink-0 bg-stone-fog overflow-hidden border border-stone-line">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              sizes="112px"
              unoptimized={value.startsWith("/uploads/")}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-ink truncate">{value}</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs border border-stone-line bg-stone-paper hover:bg-stone-fog text-ink transition-colors rounded-sm"
              >
                {isUploading ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => onChange("")}
                className="px-2.5 py-1 text-xs text-red-700 hover:text-red-900 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-stone-line hover:border-brass transition-colors p-5 text-center cursor-pointer bg-stone-paper rounded-sm ${
            isUploading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <svg className="animate-spin h-6 w-6 text-brass mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs text-ink-soft">Uploading image to server…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-fog text-ink mb-2">
                <svg className="h-5 w-5 text-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-ink">
                Click to select & upload image
              </p>
              <p className="text-[11px] text-ink-soft mt-0.5">
                JPEG, PNG, WebP up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
      {helpText && !error && <p className="text-[11px] text-ink-soft mt-0.5">{helpText}</p>}
    </div>
  );
}

interface MultiGalleryUploaderProps {
  label?: string;
  images: string[];
  onChange: (images: string[]) => void;
  className?: string;
  folder?: string;
}

export function MultiGalleryUploader({
  label = "Gallery Images",
  images = [],
  onChange,
  className = "",
  folder,
}: MultiGalleryUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    setIsUploading(true);

    const newUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: Exceeds 10MB limit.`);
        continue;
      }

      try {
        const res = await uploadMedia(file, undefined, folder);
        newUrls.push(res.url);
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message || "Upload failed."}`);
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} gallery image${newUrls.length > 1 ? "s" : ""} uploaded.`);
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
      toast.error("Some files failed to upload.");
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
          {label} ({images.length})
        </label>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-brass hover:text-brass-dark font-medium underline underline-offset-2 transition-colors disabled:opacity-50"
        >
          + Add Image(s)
        </button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-2 bg-stone-fog border border-stone-line rounded-sm">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-[4/3] bg-stone-paper border border-stone-line overflow-hidden rounded-sm">
              <Image
                src={img}
                alt={`Gallery ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
                unoptimized={img.startsWith("/uploads/")}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="px-2 py-1 bg-red-700 hover:bg-red-800 text-stone-paper text-[11px] font-medium rounded-sm shadow-md transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="absolute bottom-1 left-1 bg-black/60 text-stone-paper text-[10px] px-1 py-0.5 rounded font-mono">
                #{i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed border-stone-line hover:border-brass transition-colors p-4 text-center cursor-pointer bg-stone-paper rounded-sm ${
          isUploading ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-2 py-1 text-xs text-ink-soft">
            <svg className="animate-spin h-4 w-4 text-brass" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Uploading gallery image(s)…
          </div>
        ) : (
          <div className="text-xs text-ink-soft py-1">
            <span className="font-medium text-ink">Upload gallery photos</span> — Select one or multiple files (JPEG, PNG, WebP)
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFilesChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
