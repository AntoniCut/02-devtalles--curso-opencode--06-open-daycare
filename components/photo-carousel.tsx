/*
    *  -------------------------------------------------------------------  *
    *  -----  photo-carousel.tsx  --  /components/photo-carousel.tsx  -----  *
    *  -------------------------------------------------------------------  *
*/
"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ReactElement } from "react";
import type { FeedPostPhoto } from "@/lib/posts";

/** - `props del carrusel de fotos de una publicación` */
interface PhotoCarouselProps {
  photos: FeedPostPhoto[];
}

/**
 * ------------------------------
 * -----  `PhotoCarousel()`  -----
 * ------------------------------
 * - Carrusel de fotos: scroll horizontal con snap, puntos indicadores,
 * - navegable con teclado y swipe; sin auto-avance y sin click en las fotos.
 */
const PhotoCarousel = ({ photos }: PhotoCarouselProps): ReactElement => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  /**
   * ---------------------------
   * -----  `handleScroll()`  -----
   * ---------------------------
   * - Actualiza el punto activo según la foto visible en el scroll.
   */
  const handleScroll = (): void => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) {
      return;
    }

    const index: number = Math.round(track.scrollLeft / track.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), photos.length - 1));
  };

  /**
   * ----------------------
   * -----  `goTo(i)`  -----
   * ----------------------
   * - Desplaza el carrusel a la foto i (sin animación con reduced motion).
   */
  const goTo = (index: number): void => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const reduceMotion: boolean = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="mt-3.5">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        tabIndex={0}
        role="group"
        aria-label="Fotos de la publicación"
        className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9583C]"
      >
        {photos.map((photo) => (
          <div key={photo.path} className="relative w-full flex-none snap-center h-50">
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(max-width: 800px) 100vw, 720px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2.5">
          {photos.map((photo, index) => (
            <button
              key={photo.path}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ir a la foto ${index + 1} de ${photos.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className="flex w-6 h-6 items-center justify-center rounded-full cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${index === activeIndex ? "bg-[#C5503A]" : "bg-[#8A7C6D]"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoCarousel;
