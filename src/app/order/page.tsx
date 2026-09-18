"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChefHat,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { products as staticProducts } from "@/lib/data/products";
import Button from "@/components/ui/Button";
import { Product } from "@/types";

interface CartItem extends Product {
  quantity: number;
}

export default function OrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact_number: "",
    address: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"paymongo" | "cod">("paymongo");
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Restore cart from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("munchbite_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("munchbite_cart", JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart]);

  // Fetch logged-in user profile to prefill details
  useEffect(() => {
    async function loadCustomerProfile() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUserId(session.user.id);
          setForm((prev) => ({
            ...prev,
            email: session.user.email || prev.email,
          }));

          const { data: customer } = await supabase
            .from("customers")
            .select("name, email, contact_number, address")
            .eq("user_id", session.user.id)
            .single();

          if (customer) {
            setForm((prev) => ({
              ...prev,
              name: customer.name || prev.name,
              email: customer.email || prev.email,
              contact_number: customer.contact_number || prev.contact_number,
              address: customer.address || prev.address,
            }));
          } else if (session.user.user_metadata) {
            const meta = session.user.user_metadata;
            setForm((prev) => ({
              ...prev,
              name: meta.full_name || prev.name,
              contact_number: meta.contact_number || prev.contact_number,
              address: meta.address || prev.address,
            }));
          }
        }
      } catch {
        // Continue gracefully
      }
    }

    loadCustomerProfile();
  }, []);

  // Fetch products from Supabase, fallback to static
  useEffect(() => {
    async function loadProducts() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select("id, name, description, price, image_url, is_best_seller")
          .eq("is_available", true)
          .order("created_at", { ascending: true });

        if (error || !data || data.length === 0) {
          setProducts(staticProducts);
          return;
        }

        setProducts(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            price: p.price,
            image: p.image_url ?? "https://picsum.photos/seed/product/400/400",
            isBestSeller: p.is_best_seller,
          }))
        );
      } catch {
        setProducts(staticProducts);
      }
    }
    loadProducts();
  }, []);

  // Cart helpers
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Please add at least one item to your order.");
      return;
    }
    if (!form.name.trim() || !form.contact_number.trim()) {
      setError("Please fill in your name and contact number.");
      return;
    }

    // Validate Philippine phone format
    const cleanPhone = form.contact_number.replace(/\s+/g, "");
    if (!/^(09|\+639)\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid Philippine mobile number (e.g. 09171234567).");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            user_id: userId,
            name: form.name.trim(),
            email: form.email.trim() || undefined,
            contact_number: cleanPhone,
            address: form.address.trim(),
          },
          items: cart.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
          })),
          payment_method: paymentMethod,
          notes: form.notes.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // If PayMongo, redirect to hosted checkout
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }

      // If COD or other redirect
      if (result.redirect_url) {
        router.push(result.redirect_url);
        return;
      }

      router.push(`/order/success?order_id=${result.order_id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top Bar */}
      <header className="w-full bg-cream border-b border-soft-pink px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
              <span className="text-[10px] font-semibold text-peach tracking-wide hidden sm:block">
                Sweet Bites, Big Smiles.
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-chocolate font-semibold text-sm">
            <Link
              href="/account"
              className="flex items-center gap-1.5 text-xs text-chocolate/80 hover:text-peach font-bold"
            >
              <User size={14} className="text-peach" />
              <span className="hidden sm:inline">My Account</span>
            </Link>

            <div className="flex items-center gap-1.5 bg-white border border-soft-pink px-3 py-1.5 rounded-full text-xs font-bold">
              <ShoppingCart size={15} className="text-peach" />
              <span>
                {cart.reduce((s, i) => s + i.quantity, 0)}{" "}
                {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-chocolate">
            Place Your Order
          </h1>
          <p className="text-chocolate/60 font-medium mt-1">
            Pick your treats and check out securely. 🍪
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT — Product Selection */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-lg font-extrabold text-chocolate">
              1. Choose Your Treats
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => {
                const cartItem = cart.find((i) => i.id === product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-sm border border-soft-pink/40 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                  >
                    <div className="relative w-full aspect-video bg-cream">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                      <div>
                        <h3 className="font-bold text-chocolate text-sm">
                          {product.name}
                        </h3>
                        <p className="text-peach font-extrabold text-base">
                          ₱{product.price.toFixed(2)}
                        </p>
                      </div>
                      {cartItem ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(product.id, -1)}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 rounded-full border-2 border-peach text-peach flex items-center justify-center hover:bg-peach hover:text-white transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-chocolate w-6 text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(product.id, 1)}
                              aria-label="Increase quantity"
                              className="w-8 h-8 rounded-full bg-peach text-white flex items-center justify-center hover:bg-opacity-90 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            aria-label="Remove from cart"
                            className="text-chocolate/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => addToCart(product)}
                        >
                          Add to Order
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customer Info */}
            <h2 className="text-lg font-extrabold text-chocolate mt-4">
              2. Delivery & Payment Details
            </h2>
            <form
              id="order-form"
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-sm border border-soft-pink/40 p-6 flex flex-col gap-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-bold text-chocolate"
                  >
                    Full Name <span className="text-peach">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Maria Santos"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact_number"
                    className="text-xs font-bold text-chocolate"
                  >
                    Contact Number <span className="text-peach">*</span>
                  </label>
                  <input
                    id="contact_number"
                    name="contact_number"
                    type="tel"
                    required
                    placeholder="09171234567"
                    value={form.contact_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-bold text-chocolate"
                  >
                    Email (for receipt & order updates)
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="maria@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="address"
                    className="text-xs font-bold text-chocolate"
                  >
                    Delivery Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="House / Unit / Street, Barangay, City"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="notes"
                  className="text-xs font-bold text-chocolate"
                >
                  Special Instructions
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Any special requests or delivery instructions? (optional)"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors resize-none"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="pt-3 border-t border-soft-pink/40 flex flex-col gap-2.5">
                <label className="text-xs font-bold text-chocolate">
                  Select Payment Method <span className="text-peach">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* PayMongo Option */}
                  <label
                    onClick={() => setPaymentMethod("paymongo")}
                    className={`cursor-pointer rounded-2xl p-4 border-2 flex items-start gap-3 transition-all ${
                      paymentMethod === "paymongo"
                        ? "border-peach bg-soft-pink/20 shadow-sm"
                        : "border-soft-pink/60 bg-cream/50 hover:border-peach/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="paymongo"
                      checked={paymentMethod === "paymongo"}
                      onChange={() => setPaymentMethod("paymongo")}
                      className="mt-1 text-peach focus:ring-peach"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={16} className="text-peach" />
                        <span className="font-extrabold text-chocolate text-xs">
                          Online Payment (PayMongo)
                        </span>
                      </div>
                      <p className="text-[11px] text-chocolate/70 leading-relaxed">
                        Instant confirmation via <strong>GCash, Maya, GrabPay, Visa/Mastercard</strong>.
                      </p>
                    </div>
                  </label>

                  {/* COD Option */}
                  <label
                    onClick={() => setPaymentMethod("cod")}
                    className={`cursor-pointer rounded-2xl p-4 border-2 flex items-start gap-3 transition-all ${
                      paymentMethod === "cod"
                        ? "border-peach bg-soft-pink/20 shadow-sm"
                        : "border-soft-pink/60 bg-cream/50 hover:border-peach/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-1 text-peach focus:ring-peach"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Banknote size={16} className="text-peach" />
                        <span className="font-extrabold text-chocolate text-xs">
                          Cash on Delivery (COD)
                        </span>
                      </div>
                      <p className="text-[11px] text-chocolate/70 leading-relaxed">
                        Pay cash directly upon receiving your baked goods.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT — Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-soft-pink/40 p-6 sticky top-24 flex flex-col gap-4">
              <h2 className="text-lg font-extrabold text-chocolate">
                3. Order Summary
              </h2>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <span className="text-4xl" aria-hidden="true">
                    🛒
                  </span>
                  <p className="text-sm text-chocolate/50 font-medium">
                    Your cart is empty.
                    <br />
                    Add some treats!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-chocolate truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-chocolate/50">
                          x{item.quantity} × ₱{item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-chocolate flex-shrink-0">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-soft-pink pt-3 flex items-center justify-between">
                    <span className="font-bold text-chocolate">Total</span>
                    <span className="text-xl font-extrabold text-peach">
                      ₱{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl bg-soft-pink px-4 py-3 text-xs font-bold text-chocolate text-center"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                form="order-form"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Redirecting to Payment...
                  </>
                ) : paymentMethod === "paymongo" ? (
                  <span className="flex items-center gap-2">
                    <Lock size={15} />
                    Pay ₱{totalAmount.toFixed(2)} (PayMongo)
                  </span>
                ) : (
                  "Place Order (COD) 🍪"
                )}
              </Button>

              <div className="text-center">
                <p className="text-[11px] text-chocolate/50 flex items-center justify-center gap-1 font-medium">
                  <CheckCircle2 size={12} className="text-green-600" />
                  Secure checkout with PayMongo & SSL encryption
                </p>
              </div>

              <Link
                href="/"
                className="text-center text-xs text-chocolate/40 hover:text-peach transition-colors font-medium"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
