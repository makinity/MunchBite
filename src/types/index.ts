export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isBestSeller?: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  content: string;
  rating: number;
}

export interface NavLink {
  label: string;
  href: string;
}
