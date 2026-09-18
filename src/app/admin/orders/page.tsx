"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending","confirmed","preparing","ready","delivered","cancelled"] as const;
type OrderStatus = typeof STATUSES[number];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready:     "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  ordered_at: string;
  customers: { name: string; contact_number: string; address: string | null } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select("id, status, total_amount, notes, ordered_at, customers(name, contact_number, address)")
      .order("ordered_at", { ascending: false });
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    const { data } = await query;
    setOrders((data as unknown as Order[]) ?? []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    const supabase = createClient();
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdatingId(null);
  };

  return (
    <div className="flex flex-col gap-6">

        {/* Header */}
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
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-chocolate transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-bold text-gray-400">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Update Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{order.id.slice(0,8)}…</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-chocolate">{order.customers?.name ?? "—"}</div>
                        {order.customers?.address && (
                          <div className="text-xs text-gray-400 mt-0.5 max-w-[180px] truncate">{order.customers.address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{order.customers?.contact_number ?? "—"}</td>
                      <td className="px-6 py-4 font-bold text-chocolate">₱{Number(order.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          className="text-xs font-semibold border-2 border-soft-pink rounded-lg px-2 py-1.5 bg-cream text-chocolate focus:outline-none focus:border-peach transition-colors disabled:opacity-50 capitalize"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(order.ordered_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
