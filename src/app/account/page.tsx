"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChefHat,
  User,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  LogOut,
  PackageCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products?: {
    name: string;
    image_url?: string;
  } | null;
}

interface Order {
  id: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  payment_status?: string;
  payment_method?: string;
  total_amount: number;
  notes?: string;
  ordered_at: string;
  order_items: OrderItem[];
}

interface CustomerProfile {
  id: string;
  name: string;
  email?: string;
  contact_number: string;
  address?: string;
}

const statusBadgeMap: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pending Confirmation", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  preparing: { label: "Baking / Preparing", className: "bg-orange-100 text-orange-800" },
  ready: { label: "Ready for Delivery", className: "bg-purple-100 text-purple-800" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
};

export default function CustomerAccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Check if user is an admin
        const roleRes = await fetch("/api/auth/role");
        const roleData = await roleRes.json();
        if (!roleData.isLoggedIn) {
          router.push("/login?redirectTo=/account");
          return;
        }
        setIsAdmin(roleData.isAdmin);

        // 2. Fetch customer profile & orders
        const res = await fetch("/api/customer/orders");
        const data = await res.json();
        if (data.success) {
          if (data.profile) setProfile(data.profile);
          if (data.orders) setOrders(data.orders as Order[]);
        }
      } catch (err) {
        console.error("Error loading customer data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-peach border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-chocolate flex flex-col">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-soft-pink/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-peach text-white">
              <ChefHat size={16} />
            </div>
            <span className="text-lg font-extrabold text-chocolate tracking-tight">
              MunchBite
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-chocolate px-3.5 py-2 rounded-full hover:bg-opacity-90 transition-all shadow-sm"
              >
                <ShieldCheck size={14} className="text-peach" />
                Admin Panel
              </Link>
            )}

            <Button variant="primary" size="sm" href="/order">
              <ShoppingBag size={15} />
              Order Treats
            </Button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 text-chocolate/60 hover:text-red-600 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Admin Callout Banner */}
        {isAdmin && (
          <div className="bg-chocolate text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-peach" />
                <h2 className="font-extrabold text-base sm:text-lg">
                  Administrator Privileges Active
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-white/70">
                You are logged in as an official MunchBite Admin ({profile?.email}). You have full access to manage orders, products, and reviews.
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-peach text-white text-xs font-bold hover:bg-opacity-90 transition-all shadow"
            >
              <span>Go to Admin Panel</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-soft-pink/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-peach/10 flex items-center justify-center text-peach text-2xl font-bold">
              {isAdmin ? <ShieldCheck size={28} /> : <User size={28} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-chocolate">
                  {profile?.name || (isAdmin ? "Store Admin" : "Customer Account")}
                </h1>
                {isAdmin && (
                  <Badge className="bg-chocolate text-peach text-[11px] px-2.5 py-0.5">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-chocolate/60 font-medium">
                {profile?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 text-xs text-chocolate/70 font-medium">
            {profile?.contact_number && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-peach" />
                <span>{profile.contact_number}</span>
              </div>
            )}
            {profile?.address && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-peach" />
                <span>{profile.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-chocolate flex items-center gap-2">
              <Clock size={18} className="text-peach" />
              Order History
            </h2>
            <span className="text-xs font-bold text-chocolate/50">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center flex flex-col items-center gap-3 border border-soft-pink/40 shadow-sm">
              <PackageCheck size={40} className="text-peach/60" />
              <p className="font-bold text-base text-chocolate">No orders yet</p>
              <p className="text-xs text-chocolate/60 max-w-sm">
                Ready for some fresh cookies or brownies? Place your first order and track it right here!
              </p>
              <Button variant="primary" size="md" href="/order" className="mt-2">
                Browse Menu & Order
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const badge = statusBadgeMap[order.status] ?? {
                  label: order.status,
                  className: "bg-gray-100 text-gray-800",
                };
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-soft-pink/40 flex flex-col gap-4 transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-soft-pink/30">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-chocolate">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Badge className={badge.className}>
                          {badge.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-chocolate/50 font-medium">
                        {new Date(order.ordered_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="divide-y divide-soft-pink/20">
                      {order.order_items?.map((item) => (
                        <div
                          key={item.id}
                          className="py-2 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-chocolate">
                              {item.quantity}x
                            </span>
                            <span className="text-chocolate/80 font-medium">
                              {item.products?.name ?? "Pastry item"}
                            </span>
                          </div>
                          <span className="font-bold text-chocolate">
                            ₱{Number(item.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Total & Notes */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-soft-pink/30 gap-2">
                      {order.notes ? (
                        <p className="text-[11px] text-chocolate/60 italic">
                          Note: &ldquo;{order.notes}&rdquo;
                        </p>
                      ) : <div />}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-xs font-bold text-chocolate/70">
                          Total Amount:
                        </span>
                        <span className="text-base font-extrabold text-peach">
                          ₱{Number(order.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
