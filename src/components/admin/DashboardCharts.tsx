"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend,
} from "recharts";

interface SalesData { date: string; sales: number }
interface StatusData { name: string; value: number }

interface DashboardChartsProps {
  salesChartData: SalesData[];
  statusChartData: StatusData[];
}

const STATUS_PIE_COLORS: Record<string, string> = {
  pending:   "#FFB07C",
  confirmed: "#60A5FA",
  preparing: "#A78BFA",
  ready:     "#34D399",
  delivered: "#9CA3AF",
  cancelled: "#F87171",
};

const DEFAULT_COLORS = ["#FFB07C", "#F7C8C8", "#5C3A2E", "#60A5FA", "#34D399", "#F87171"];

export default function DashboardCharts({ salesChartData, statusChartData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* Sales Line Chart — takes 2/3 width on desktop */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-extrabold text-chocolate mb-6">Sales — Last 7 Days</h2>
        {salesChartData.every((d) => d.sales === 0) ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            No sales data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8dc" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₱${v}`}
              />
              <Tooltip
                formatter={(value: number) => [`₱${value.toFixed(2)}`, "Sales"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 600,
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#FFB07C"
                strokeWidth={3}
                dot={{ fill: "#FFB07C", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#5C3A2E" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders by Status Pie Chart — 1/3 width */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-extrabold text-chocolate mb-6">Orders by Status</h2>
        {statusChartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            No order data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_PIE_COLORS[entry.name] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: "#5C3A2E" }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
