"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Customer {
  id: string;
  name: string;
  contact_number: string | null;
  address: string | null;
  created_at: string;
  order_count?: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("customers")
        .select("id, name, contact_number, address, created_at")
        .order("created_at", { ascending: false });
      setCustomers((data as Customer[]) ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_number ?? "").includes(search)
  );

  return (
    <div className="flex flex-col gap-6">

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name or contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-soft-pink bg-cream text-chocolate text-sm font-medium focus:outline-none focus:border-peach transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-sm text-gray-400">Loading customers…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sm text-gray-400">
              {search ? "No customers match your search." : "No customers yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-bold text-gray-400">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((customer, i) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-peach/20 flex items-center justify-center text-peach font-extrabold text-sm flex-shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-chocolate">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{customer.contact_number ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">{customer.address ?? "—"}</td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(customer.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-right">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
