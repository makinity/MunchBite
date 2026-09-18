import Image from "next/image";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative bg-cream overflow-hidden min-h-[calc(100vh-5rem)] flex items-center"
    >
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="absolute -left-16 top-8 w-48 h-48 md:w-72 md:h-72 rounded-full bg-soft-pink opacity-60 blur-sm pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -left-8 bottom-12 w-32 h-32 md:w-48 md:h-48 rounded-full bg-peach opacity-40 blur-sm pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 w-64 h-64 md:w-96 md:h-96 rounded-full bg-soft-pink opacity-20 blur-2xl pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — Text Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
            {/* Decorative dash lines */}
            <div className="flex items-center gap-3 text-peach" aria-hidden="true">
              <span className="w-6 h-0.5 bg-peach rounded-full" />
              <span className="w-3 h-0.5 bg-peach rounded-full" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-chocolate leading-tight">
              A Little Treat,{" "}
              <span className="relative inline-block">
                Made With Love.
                <span
                  aria-hidden="true"
                  className="absolute -top-3 -right-6 text-2xl"
                >
                  🩷
                </span>
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-chocolate/75 max-w-md leading-relaxed">
              Delicious homemade treats made fresh for every craving. Perfect for
              sharing, gifting, or simply treating yourself. 💕
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Button variant="primary" size="lg" href="/order">
                Order Now <ArrowRight size={18} />
              </Button>
              <Button variant="secondary" size="lg" href="#best-sellers">
                View Menu
              </Button>
            </div>
          </div>

          {/* Right — Product Image */}
          <div className="relative flex items-center justify-center">
            {/* Background soft circle */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-3xl bg-soft-pink/30 blur-xl scale-90"
            />
            <div className="relative w-full max-w-sm lg:max-w-full aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="https://picsum.photos/seed/munchbite-hero/800/600"
                alt="MunchBite treats — cookies, brownies, and cupcakes"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 50vw"
              />
            </div>

            {/* MunchBite label badge on image */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-md">
              <div className="flex items-center gap-1.5">
                <UtensilsCrossed size={14} className="text-peach" />
                <span className="text-xs font-bold text-chocolate">MUNCHBITE</span>
              </div>
              <p className="text-[10px] text-chocolate/60 font-medium">Sweet Bites, Big Smiles.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
