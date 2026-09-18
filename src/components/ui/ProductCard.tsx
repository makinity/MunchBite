import Image from "next/image";
import { Product } from "@/types";
import Button from "./Button";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-cream overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-chocolate">{product.name}</h3>
          <p className="text-lg font-extrabold text-chocolate">
            ₱{product.price.toFixed(2)}
          </p>
        </div>
        <Button variant="primary" size="sm" className="w-full">
          Order Now
        </Button>
      </div>
    </div>
  );
}
