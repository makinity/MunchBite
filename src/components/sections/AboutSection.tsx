import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

export default function AboutSection() {
  return (
    <section id="about" className="bg-cream py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — Image */}
          <div className="relative flex items-center justify-center">
            {/* Decorative hearts */}
            <span
              aria-hidden="true"
              className="absolute -top-4 -right-2 text-2xl opacity-60"
            >
              🩷
            </span>
            <span
              aria-hidden="true"
              className="absolute bottom-4 -left-4 text-xl opacity-50"
            >
              💛
            </span>

            <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="https://picsum.photos/seed/munchbite-about/600/600"
                alt="MunchBite branded packaging with delicious treats"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 45vw"
              />
            </div>
          </div>

          {/* Right — Text */}
          <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
            <SectionHeading
              label="About MunchBite"
              heading="More Than Just a Treat"
              subtext="At MunchBite, we believe that good food can make ordinary moments a little sweeter. We create delicious treats that are made with care, quality ingredients, and a whole lot of love."
              align="left"
            />
            <Button variant="primary" size="md" href="#order">
              Learn More About Us
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
