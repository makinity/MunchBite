import { createClient } from "@/lib/supabase/server";
import { products as staticProducts } from "@/lib/data/products";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/types";

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, image_url, is_best_seller")
      .eq("is_available", true)
      .eq("is_best_seller", true)
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback to static data if Supabase is unavailable or empty
      return staticProducts;
    }

    return data.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      image: p.image_url ?? "https://picsum.photos/seed/product/400/400",
      isBestSeller: p.is_best_seller,
    }));
  } catch {
    // Network error or misconfiguration — fall back to static data
    return staticProducts;
  }
}

export default async function BestSellersSection() {
  const products = await getProducts();

  return (
    <section id="best-sellers" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="flex justify-center mb-12">
          <SectionHeading
            label="Our Favorites"
            heading="Best Sellers"
            subtext="Discover the treats our customers can't get enough of."
            align="center"
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </section>
  );
}
