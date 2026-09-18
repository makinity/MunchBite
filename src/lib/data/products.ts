import { Product } from "@/types";

export const products: Product[] = [
  {
    id: "1",
    name: "Choco Chip Cookies",
    description: "Classic homemade cookies loaded with chocolate chips. Crispy on the outside, chewy on the inside.",
    price: 60,
    image: "https://picsum.photos/seed/cookies/400/400",
    isBestSeller: true,
  },
  {
    id: "2",
    name: "Fudge Brownies",
    description: "Rich, dense, and ultra-fudgy brownies made with premium chocolate. A crowd favorite.",
    price: 70,
    image: "https://picsum.photos/seed/brownies/400/400",
    isBestSeller: true,
  },
  {
    id: "3",
    name: "Cupcakes",
    description: "Soft and fluffy cupcakes topped with creamy frosting. Perfect for any celebration.",
    price: 65,
    image: "https://picsum.photos/seed/cupcakes/400/400",
    isBestSeller: true,
  },
  {
    id: "4",
    name: "Treat Box (Assorted)",
    description: "A delightful mix of our best treats — perfect for sharing or gifting to someone special.",
    price: 150,
    image: "https://picsum.photos/seed/treatbox/400/400",
    isBestSeller: true,
  },
];
