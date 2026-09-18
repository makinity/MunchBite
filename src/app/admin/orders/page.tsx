"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Bell,
  CreditCard,
  Banknote,
  Clock,
  Sparkles,
  Phone,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
] as const;
type OrderStatus = typeof STATUSES[number];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products?: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  status: OrderStatus;
  payment_status?: "unpaid" | "paid" | "refunded" | "failed";
  payment_method?: string;
  total_amount: number;
  notes: string | null;
  ordered_at: string;
  customers: {
    name: string;
    contact_number: string;
    address: string | null;
  } | null;
  order_items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Play a crisp, gentle order chime using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Note 1 (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2 (G#5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(830.61, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch {
      // Audio playback blocked or unsupported
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${filterStatus}`);
      const result = await res.json();
      if (result.success) {
        setOrders(result.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin orders:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time listener for incoming orders
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => {
          playNotificationSound();
          setNotification("🔔 New Order Received! Refreshing list...");
          fetchOrders();
          setTimeout(() => setNotification(null), 6000);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, playNotificationSound]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Real-time Alert Banner */}
      {notification && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 bg-peach text-white px-5 py-3.5 rounded-2xl shadow-lg animate-bounce"
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Bell size={18} className="animate-pulse" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Refresh Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors capitalize ${
                filterStatus === s
                  ? "bg-chocolate text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-chocolate"
              }`}
            >
              {s === "all" ? "All Orders" : s}
            </button>
          ))}
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-chocolate transition-colors bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            <RefreshCw size={18} className="animate-spin mr-2 text-peach" />
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <Sparkles size={32} className="text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">No orders found.</p>
            <p className="text-xs text-gray-400">
              New orders will appear here automatically with live alerts!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr className="text-left text-xs font-bold text-gray-500">
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer & Details</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const isPaid = order.payment_status === "paid";
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* ID & Date */}
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-chocolate text-xs">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                          <Clock size={11} />
                          {new Date(order.ordered_at).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-chocolate text-xs">
                          {order.customers?.name ?? "Guest Customer"}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                          <Phone size={11} className="text-peach" />
                          <span>{order.customers?.contact_number ?? "—"}</span>
                        </div>
                        {order.customers?.address && (
                          <div className="flex items-start gap-1 text-[11px] text-gray-400 mt-0.5 max-w-xs truncate">
                            <MapPin size={11} className="text-peach flex-shrink-0 mt-0.5" />
                            <span>{order.customers.address}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="text-[11px] text-amber-700 italic mt-1 bg-amber-50 px-2 py-0.5 rounded">
                            &ldquo;{order.notes}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* Line Items */}
                      <td className="px-6 py-4 text-xs text-gray-700">
                        {order.order_items && order.order_items.length > 0 ? (
                          <div className="space-y-0.5">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="text-xs">
                                <span className="font-bold text-chocolate">
                                  {item.quantity}x
                                </span>{" "}
                                {item.products?.name ?? "Item"}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="px-6 py-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            <CreditCard size={11} />
                            Paid (PayMongo)
                          </span>
                        ) : order.payment_method === "cod" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                            <Banknote size={11} />
                            Cash on Delivery
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <CreditCard size={11} />
                            PayMongo (Unpaid)
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 font-extrabold text-peach text-sm">
                        ₱{Number(order.total_amount).toFixed(2)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) =>
                            updateStatus(order.id, e.target.value as OrderStatus)
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 focus:outline-none cursor-pointer transition-all ${
                            STATUS_COLORS[order.status]
                          } ${updatingId === order.id ? "opacity-50" : ""}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white text-chocolate">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
