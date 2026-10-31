"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

type GalleryImage = { src: string; alt: string };

export function ProductGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const current = images[active] || images[0];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (zoomed && !dialog.open) dialog.showModal();
    if (!zoomed && dialog.open) dialog.close();
  }, [zoomed]);

  if (!current) {
    return (
      <div className="aspect-square rounded-3xl bg-pb-ivory" aria-hidden="true" />
    );
  }

  return (
    <div>
      <button
        type="button"
        className="pb-gallery-main relative aspect-square w-full overflow-hidden rounded-3xl bg-[#f7f4f1] text-left"
        onClick={() => setZoomed(true)}
        aria-label={`Zoom image of ${name}`}
      >
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt || name}
          fill
          priority
          sizes="(max-width:768px) 100vw, 50vw"
          className="pb-gallery-fade object-contain p-6 md:p-8"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-pb-muted">
          Tap to zoom
        </span>
      </button>
      {images.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <li key={`${img.src}-${index}`}>
              <button
                type="button"
                className={`pb-thumb relative h-16 w-16 overflow-hidden rounded-xl border bg-[#f7f4f1] ${
                  index === active ? "is-active border-pb-pink" : "border-pb-border"
                }`}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain p-1.5"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        className="pb-dialog-motion m-0 max-h-none w-full max-w-none border-0 bg-black/80 p-4 text-white backdrop:bg-black/70 md:p-8"
        aria-labelledby={titleId}
        onClose={() => setZoomed(false)}
        onClick={() => setZoomed(false)}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="text-sm font-semibold">
              {name}
            </h2>
            <button
              type="button"
              className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold"
              onClick={() => setZoomed(false)}
            >
              Close
            </button>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-3xl overflow-hidden rounded-2xl bg-white">
            <Image
              key={`zoom-${current.src}`}
              src={current.src}
              alt={current.alt || name}
              fill
              sizes="100vw"
              className="pb-gallery-fade object-contain p-4"
            />
          </div>
        </div>
      </dialog>
    </div>
  );
}
