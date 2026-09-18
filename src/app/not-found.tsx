import Link from "next/link";
import { ChefHat } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Top Bar */}
      <header className="w-full px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          aria-label="Back to MunchBite Home"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-peach text-white">
            <ChefHat size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold text-chocolate tracking-tight">
              MunchBite
            </span>
            <span className="text-[10px] font-semibold text-peach tracking-wide">
              Sweet Bites, Big Smiles.
            </span>
          </div>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">

        {/* Decorative blobs */}
        <div aria-hidden="true" className="fixed -top-20 -left-20 w-72 h-72 rounded-full bg-soft-pink opacity-40 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="fixed -bottom-20 -right-20 w-72 h-72 rounded-full bg-peach opacity-20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center gap-6 text-center max-w-md">

          {/* Big emoji */}
          <span className="text-7xl" aria-hidden="true">🍪</span>

          {/* 404 */}
          <div className="flex flex-col gap-2">
            <h1 className="text-8xl font-extrabold text-peach leading-none">
              404
            </h1>
            <h2 className="text-2xl font-extrabold text-chocolate">
              Oops! Page Not Found
            </h2>
            <p className="text-base text-chocolate/60 font-medium leading-relaxed">
              Looks like this treat doesn&apos;t exist yet. Maybe it&apos;s still in the oven! 🧁
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <Button variant="primary" size="md" href="/">
              Back to Home
            </Button>
            <Button variant="secondary" size="md" href="/#best-sellers">
              View Our Menu
            </Button>
          </div>

          {/* Tagline */}
          <p className="text-sm font-semibold text-chocolate/30 mt-4">
            Sweet Bites, Big Smiles. 🩷
          </p>
        </div>
      </main>
    </div>
  );
}
