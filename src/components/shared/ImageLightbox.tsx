"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface LightboxItem {
  src: string;
  label?: string;
  description?: string;
}

interface ImageLightboxProps {
  items: LightboxItem[];
  initialIndex?: number;
  onClose: () => void;
  title?: string;
}

export function ImageLightbox({ items, initialIndex = 0, onClose, title }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight") {
        setIndex((prev) => (prev + 1) % items.length);
      } else if (event.key === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [items.length, onClose]);

  if (!items.length) {
    return null;
  }

  const showPrev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);
  const showNext = () => setIndex((prev) => (prev + 1) % items.length);
  const activeItem = items[index] ?? items[0];
  const activeLabel = activeItem?.label ?? "Photo";
  const activeDescription = activeItem?.description;
  const activeSrc = activeItem?.src ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-zoom-out"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative max-w-5xl w-full">
        <div className="bg-black/40 rounded-3xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between text-white px-6 py-4 border-b border-white/10">
            <div>
              {title && <p className="text-xs uppercase tracking-wide text-white/60">{title}</p>}
              <p className="text-base font-semibold">
                {activeLabel} · Photo {index + 1} / {items.length}
              </p>
              {activeDescription && (
                <p className="text-xs text-white/70 mt-1 max-w-xl">{activeDescription}</p>
              )}
            </div>
            <button
              type="button"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              onClick={onClose}
              aria-label="Close gallery"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative bg-black">
            <div className="relative w-full h-[60vh] sm:h-[70vh]">
              <Image
                src={activeSrc}
                alt={activeLabel}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
