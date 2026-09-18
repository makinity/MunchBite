import { createClient } from "@/lib/supabase/server";
import DashboardCharts from "@/components/admin/DashboardCharts";
import { ShoppingBag, PhilippinePeso, Clock, Package } from "lucide-react";

interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  ordered_at: string;
  customers: { name: string } | null;
}

async function getDashboardData() {
  const supabase = createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [ordersToday, pendingOrders, totalProducts, recentOrders, salesByDay, ordersByStatus] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, total_amount", { count: "exact" })
        .gte("ordered_at", todayISO),

      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("is_available", true),

      supabase
        .from("orders")
        .select("id, status, total_amount, ordered_at, customers(name)")
        .order("ordered_at", { ascending: false })
        .limit(5),

      supabase
        .from("orders")
        .select("ordered_at, total_amount")
        .gte("ordered_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .not("status", "eq", "cancelled"),

      supabase
        .from("orders")
        .select("status"),
    ]);

  // Aggregate sales by day (last 7 days)
  const salesMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    salesMap[key] = 0;
  }
  for (const order of salesByDay.data ?? []) {
    const key = new Date(order.ordered_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    if (key in salesMap) salesMap[key] += Number(order.total_amount);
  }
  const salesChartData = Object.entries(salesMap).map(([date, sales]) => ({ date, sales }));

  // Aggregate orders by status
  const statusCount: Record<string, number> = {};
  for (const o of ordersByStatus.data ?? []) {
    statusCount[o.status] = (statusCount[o.status] ?? 0) + 1;
  }
  const statusChartData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  const salesToday = (ordersToday.data ?? []).reduce(
    (sum, o) => sum + Number(o.total_amount), 0
  );

  return {
    ordersToday: ordersToday.count ?? 0,
    salesToday,
    pendingOrders: pendingOrders.count ?? 0,
    totalProducts: totalProducts.count ?? 0,
    recentOrders: (recentOrders.data ?? []) as unknown as RecentOrder[],
    salesChartData,
    statusChartData,
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready:     "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const statCards = [
    {
      label: "Orders Today",
      value: data.ordersToday,
      icon: ShoppingBag,
      color: "bg-peach/10 text-peach",
    },
    {
      label: "Sales Today",
      value: `₱${data.salesToday.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      icon: PhilippinePeso,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Pending Orders",
      value: data.pendingOrders,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "Active Products",
      value: data.totalProducts,
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-chocolate">{card.value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        salesChartData={data.salesChartData}
        statusChartData={data.statusChartData}
      />

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-extrabold text-chocolate mb-4">Recent Orders</h2>
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-400 border-b border-gray-100">
                  <th className="pb-3 pr-4">Order ID</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-400">{order.id.slice(0, 8)}…</td>
                    <td className="py-3 pr-4 font-semibold text-chocolate">{order.customers?.name ?? "—"}</td>
                    <td className="py-3 pr-4 font-bold text-chocolate">₱{Number(order.total_amount).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-400">
                      {new Date(order.ordered_at).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
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
