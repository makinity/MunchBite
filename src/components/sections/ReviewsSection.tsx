import { createClient } from "@/lib/supabase/server";
import { reviews as staticReviews } from "@/lib/data/reviews";
import { Review } from "@/types";
import ReviewsCarousel from "@/components/ui/ReviewsCarousel";
import SectionHeading from "@/components/ui/SectionHeading";

async function getReviews(): Promise<Review[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, customer_name, content, rating")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return staticReviews;
    }

    return data.map((r) => ({
      id: r.id,
      customerName: r.customer_name,
      content: r.content,
      rating: r.rating,
    }));
  } catch {
    return staticReviews;
  }
}

export default async function ReviewsSection() {
  const reviews = await getReviews();

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="flex justify-center mb-12">
          <SectionHeading
            label="What Our Customers Say"
            heading="What They're Saying"
            align="center"
          />
        </div>

        {/* Client-side carousel gets the reviews as props */}
        <ReviewsCarousel reviews={reviews} />

      </div>
    </section>
  );
}
