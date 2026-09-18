"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChefHat, ShoppingCart, Plus, Minus, Trash2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { products as staticProducts } from "@/lib/data/products";
import Button from "@/components/ui/Button";
import { Product } from "@/types";

interface CartItem extends Product {
  quantity: number;
}

export default function OrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ name: "", contact_number: "", address: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch products from Supabase, fallback to static
  useEffect(() => {
    async function load() {
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
    load();
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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            contact_number: form.contact_number.trim(),
            address: form.address.trim(),
          },
          items: cart.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
          })),
          notes: form.notes.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setIsSuccess(true);
      setCart([]);
      setForm({ name: "", contact_number: "", address: "", notes: "" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center gap-6">
        <div aria-hidden="true" className="fixed -top-20 -left-20 w-72 h-72 rounded-full bg-soft-pink opacity-40 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="fixed -bottom-20 -right-20 w-72 h-72 rounded-full bg-peach opacity-20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4 bg-white rounded-3xl shadow-xl px-10 py-12 max-w-md w-full">
          <CheckCircle size={56} className="text-peach" />
          <h1 className="text-2xl font-extrabold text-chocolate">Order Placed! 🎉</h1>
          <p className="text-chocolate/70 font-medium text-sm leading-relaxed">
            Thank you for your order! We&apos;ll contact you shortly to confirm and arrange delivery.
          </p>
          <p className="text-xs text-chocolate/40 font-semibold">Sweet Bites, Big Smiles. 🩷</p>
          <Button variant="primary" size="md" href="/" className="mt-2 w-full">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Top Bar */}
      <header className="w-full bg-cream border-b border-soft-pink px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Back to MunchBite Home">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-peach text-white">
              <ChefHat size={16} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold text-chocolate tracking-tight">MunchBite</span>
              <span className="text-[10px] font-semibold text-peach tracking-wide hidden sm:block">Sweet Bites, Big Smiles.</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-chocolate font-semibold text-sm">
            <ShoppingCart size={16} className="text-peach" />
            {cart.length > 0 ? (
              <span>{cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}</span>
            ) : (
              <span className="text-chocolate/40">Empty cart</span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-chocolate">Place Your Order</h1>
          <p className="text-chocolate/60 font-medium mt-1">Pick your treats and we&apos;ll take care of the rest. 🍪</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — Product Selection */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-lg font-extrabold text-chocolate">1. Choose Your Treats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => {
                const cartItem = cart.find((i) => i.id === product.id);
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
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
                        <h3 className="font-bold text-chocolate text-sm">{product.name}</h3>
                        <p className="text-peach font-extrabold text-base">₱{product.price.toFixed(2)}</p>
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
                            <span className="font-bold text-chocolate w-6 text-center">{cartItem.quantity}</span>
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
                        <Button variant="primary" size="sm" className="w-full" onClick={() => addToCart(product)}>
                          Add to Order
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customer Info */}
            <h2 className="text-lg font-extrabold text-chocolate mt-4">2. Your Details</h2>
            <form id="order-form" onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-sm font-semibold text-chocolate">Full Name <span className="text-peach">*</span></label>
                  <input
                    id="name" name="name" type="text" required
                    placeholder="Maria Santos"
                    value={form.name} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact_number" className="text-sm font-semibold text-chocolate">Contact Number <span className="text-peach">*</span></label>
                  <input
                    id="contact_number" name="contact_number" type="tel" required
                    placeholder="09171234567"
                    value={form.contact_number} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className="text-sm font-semibold text-chocolate">Delivery Address</label>
                <input
                  id="address" name="address" type="text"
                  placeholder="123 Sampaguita St, Coil, Quezon"
                  value={form.address} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-sm font-semibold text-chocolate">Special Instructions</label>
                <textarea
                  id="notes" name="notes" rows={3}
                  placeholder="Any special requests? (optional)"
                  value={form.notes} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-soft-pink bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none focus:border-peach transition-colors resize-none"
                />
              </div>
            </form>
          </div>

          {/* RIGHT — Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24 flex flex-col gap-4">
              <h2 className="text-lg font-extrabold text-chocolate">3. Order Summary</h2>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <span className="text-4xl" aria-hidden="true">🛒</span>
                  <p className="text-sm text-chocolate/50 font-medium">Your cart is empty.<br />Add some treats!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-chocolate truncate">{item.name}</p>
                        <p className="text-xs text-chocolate/50">x{item.quantity} × ₱{item.price.toFixed(2)}</p>
                      </div>
                      <span className="text-sm font-bold text-chocolate flex-shrink-0">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-soft-pink pt-3 flex items-center justify-between">
                    <span className="font-bold text-chocolate">Total</span>
                    <span className="text-xl font-extrabold text-peach">₱{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-xl bg-soft-pink px-4 py-3 text-sm font-semibold text-chocolate text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                form="order-form"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? "Placing Order..." : "Place Order 🍪"}
              </Button>

              <Link href="/" className="text-center text-xs text-chocolate/40 hover:text-peach transition-colors font-medium">
                ← Back to Home
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
