"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  ShoppingBag,
  MessageCircle,
  MapPin,
  Phone,
  CreditCard,
  Banknote,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface OrderDetails {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  notes?: string;
  ordered_at: string;
  customers?: {
    name: string;
    contact_number: string;
    address?: string;
  } | null;
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    products?: {
      name: string;
    } | null;
  }>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear cart in localStorage upon successful checkout
    try {
      localStorage.removeItem("munchbite_cart");
    } catch {
      // ignore
    }

    async function verifyAndFetchOrder() {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/orders/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId, session_id: sessionId }),
        });

        const result = await res.json();
        if (result.success && result.data) {
          setOrder(result.data as OrderDetails);
        }
      } catch (err) {
        console.error("Error verifying order confirmation:", err);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAndFetchOrder();
  }, [orderId, sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="text-peach animate-spin" />
        <p className="text-sm font-bold text-chocolate">Confirming your payment & order...</p>
      </div>
    );
  }

  const orderRef = orderId
    ? `#MB-${orderId.slice(0, 8).toUpperCase()}`
    : "#MB-ORDER";
  const messengerUrl =
    process.env.NEXT_PUBLIC_ORDER_LINK ||
    process.env.NEXT_PUBLIC_FACEBOOK_URL ||
    "https://m.me";

  const isPaid = order?.payment_status === "paid";
  const isOnline = order?.payment_method === "paymongo";

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Glow Effects */}
      <div
        aria-hidden="true"
        className="fixed -top-20 -left-20 w-72 h-72 rounded-full bg-soft-pink opacity-40 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="fixed -bottom-20 -right-20 w-72 h-72 rounded-full bg-peach opacity-20 blur-3xl pointer-events-none"
      />

      <div className="relative bg-white rounded-3xl shadow-xl px-6 sm:px-10 py-10 max-w-lg w-full flex flex-col items-center text-center gap-5 border border-soft-pink/40">
        <div className="w-16 h-16 rounded-full bg-peach/10 flex items-center justify-center text-peach">
          <CheckCircle size={44} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-chocolate">
            {isPaid
              ? "Payment Successful! 🎉"
              : isOnline
              ? "Order Placed & Awaiting Payment"
              : "Order Placed! 🎉"}
          </h1>
          <p className="text-xs sm:text-sm text-chocolate/70 font-medium mt-1">
            {isPaid
              ? "We received your payment via PayMongo and are now preparing your treats!"
              : "Thank you for your order! We are getting your freshly baked treats ready."}
          </p>
        </div>

        {/* Reference & Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="bg-cream border border-soft-pink px-3.5 py-1.5 rounded-xl text-xs font-bold text-chocolate">
            Ref: <span className="text-peach">{orderRef}</span>
          </div>

          {isPaid ? (
            <Badge className="bg-green-100 text-green-800">
              <CreditCard size={12} className="inline mr-1" />
              Paid via PayMongo
            </Badge>
          ) : isOnline ? (
            <Badge className="bg-amber-100 text-amber-800">
              <CreditCard size={12} className="inline mr-1" />
              PayMongo (Pending)
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800">
              <Banknote size={12} className="inline mr-1" />
              Cash on Delivery
            </Badge>
          )}
        </div>

        {/* Order Details Card */}
        {order && (
          <div className="w-full bg-cream rounded-2xl p-4 text-left space-y-3 border border-soft-pink/50 text-xs">
            {/* Customer Details */}
            {order.customers && (
              <div className="space-y-1 pb-3 border-b border-soft-pink/40">
                <p className="font-bold text-chocolate text-xs">
                  {order.customers.name}
                </p>
                <div className="flex items-center gap-1.5 text-chocolate/70">
                  <Phone size={12} className="text-peach" />
                  <span>{order.customers.contact_number}</span>
                </div>
                {order.customers.address && (
                  <div className="flex items-center gap-1.5 text-chocolate/70">
                    <MapPin size={12} className="text-peach" />
                    <span>{order.customers.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* Itemized List */}
            {order.order_items && order.order_items.length > 0 && (
              <div className="space-y-1.5 pb-2">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-chocolate/80"
                  >
                    <span>
                      {item.quantity}x {item.products?.name ?? "Pastry"}
                    </span>
                    <span className="font-bold text-chocolate">
                      ₱{Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-soft-pink/40 font-bold text-chocolate text-sm">
              <span>Total Paid</span>
              <span className="text-peach text-base font-extrabold">
                ₱{Number(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          <Button
            variant="primary"
            size="md"
            href="/account"
            className="w-full justify-center"
          >
            <ShoppingBag size={16} />
            View in My Orders
          </Button>

          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border-2 border-soft-pink text-xs font-bold text-chocolate hover:border-peach hover:text-peach transition-colors"
          >
            <MessageCircle size={15} />
            Message Us on Messenger
          </a>

          <Link
            href="/"
            className="text-xs text-chocolate/50 hover:text-peach transition-colors font-medium mt-1"
          >
            ← Back to MunchBite Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <Loader2 size={32} className="text-peach animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
