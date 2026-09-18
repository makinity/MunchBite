import { ShoppingCart } from "lucide-react";
import Button from "@/components/ui/Button";

export default function FinalCTASection() {
  return (
    <section
      id="order"
      className="relative bg-chocolate overflow-hidden py-20 md:py-28"
    >
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="absolute -top-10 -left-10 w-40 h-40 md:w-64 md:h-64 rounded-full bg-soft-pink opacity-20 blur-2xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-10 -right-10 w-48 h-48 md:w-72 md:h-72 rounded-full bg-peach opacity-20 blur-2xl pointer-events-none"
      />

      {/* Decorative hearts */}
      <span
        aria-hidden="true"
        className="absolute left-8 top-8 text-2xl opacity-30"
      >
        🩷
      </span>
      <span
        aria-hidden="true"
        className="absolute left-12 bottom-10 text-xl opacity-20"
      >
        ✦
      </span>
      <span
        aria-hidden="true"
        className="absolute right-10 top-10 text-xl opacity-20"
      >
        ✦
      </span>
      <span
        aria-hidden="true"
        className="absolute right-8 bottom-8 text-2xl opacity-30"
      >
        🧁
      </span>

      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Ready for a Little MunchBite Treat?
        </h2>
        <p className="text-base md:text-lg text-white/80 font-medium">
          Treat yourself today. 💕
        </p>
        <Button variant="primary" size="lg" href="/order" className="mt-2">
          <ShoppingCart size={20} />
          Order Now
        </Button>
      </div>
    </section>
  );
}
