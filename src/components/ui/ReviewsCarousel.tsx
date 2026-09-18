"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Review } from "@/types";
import ReviewCard from "./ReviewCard";

interface ReviewsCarouselProps {
  reviews: Review[];
}

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (reviews.length === 0) return null;

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? reviews.length - 1 : i - 1));

  const next = () =>
    setCurrentIndex((i) => (i === reviews.length - 1 ? 0 : i + 1));

  return (
    <div className="relative">
      {/* Carousel + Accent */}
      <div className="flex items-center gap-4 md:gap-8">

        {/* Prev Button */}
        <button
          onClick={prev}
          aria-label="Previous review"
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-2 border-peach text-peach hover:bg-peach hover:text-white transition-colors duration-200"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Card */}
        <div className="flex-1 min-w-0">
          <ReviewCard review={reviews[currentIndex]} />
        </div>

        {/* Next Button */}
        <button
          onClick={next}
          aria-label="Next review"
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-2 border-peach text-peach hover:bg-peach hover:text-white transition-colors duration-200"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div
        className="flex justify-center gap-2 mt-6"
        role="tablist"
        aria-label="Review navigation"
      >
        {reviews.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`Review ${i + 1}`}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              i === currentIndex ? "bg-peach scale-125" : "bg-soft-pink"
            }`}
          />
        ))}
      </div>

      {/* Real Treats accent */}
      <p className="text-center font-extrabold text-xl text-chocolate/20 italic mt-8">
        Real Treats. Real Smiles. 🩷
      </p>
    </div>
  );
}
