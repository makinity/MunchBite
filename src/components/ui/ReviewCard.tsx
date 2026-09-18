import { Review } from "@/types";
import { Star } from "lucide-react";

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white shadow-md px-8 py-8 text-center max-w-xl mx-auto">
      {/* Stars */}
      <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={20}
            className={
              i < review.rating
                ? "fill-peach text-peach"
                : "fill-gray-200 text-gray-200"
            }
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-base md:text-lg font-semibold text-chocolate italic leading-relaxed">
        &ldquo;{review.content}&rdquo;
      </p>

      {/* Customer Name */}
      <p className="text-sm font-bold text-chocolate/70">— {review.customerName}</p>
    </div>
  );
}
