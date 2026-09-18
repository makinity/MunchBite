import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import BestSellersSection from "@/components/sections/BestSellersSection";
import WhyMunchBiteSection from "@/components/sections/WhyMunchBiteSection";
import AboutSection from "@/components/sections/AboutSection";
import ReviewsSection from "@/components/sections/ReviewsSection";
import FinalCTASection from "@/components/sections/FinalCTASection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <BestSellersSection />
        <WhyMunchBiteSection />
        <AboutSection />
        <ReviewsSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
}
