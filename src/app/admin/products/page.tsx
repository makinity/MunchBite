"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_best_seller: boolean;
  stock: number | null;
}

const emptyForm = {
  name: "", description: "", price: "", image_url: "",
  is_available: true, is_best_seller: false, stock: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, description: p.description ?? "",
      price: String(p.price), image_url: p.image_url ?? "",
      is_available: p.is_available, is_best_seller: p.is_best_seller,
      stock: p.stock != null ? String(p.stock) : "",
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      image_url: form.image_url.trim() || null,
      is_available: form.is_available,
      is_best_seller: form.is_best_seller,
      stock: form.stock ? parseInt(form.stock) : null,
    };
    if (editId) {
      await supabase.from("products").update(payload).eq("id", editId);
    } else {
      await supabase.from("products").insert(payload);
    }
    await fetchProducts();
    closeForm();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this product from the menu?")) return;
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("products").update({ is_available: false }).eq("id", id);
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_available: false } : p));
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">{products.length} product{products.length !== 1 ? "s" : ""}</p>
          <Button variant="primary" size="sm" onClick={openAdd}>
            <Plus size={16} /> Add Product
          </Button>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-chocolate">{editId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-chocolate transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "name", label: "Product Name *", type: "text", placeholder: "Choco Chip Cookies" },
                { id: "price", label: "Price (₱) *", type: "number", placeholder: "60" },
                { id: "image_url", label: "Image URL", type: "text", placeholder: "https://..." },
                { id: "stock", label: "Stock", type: "number", placeholder: "Optional" },
              ].map((field) => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-chocolate">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as Record<string, string | boolean>)[field.id] as string}
                    onChange={(e) => setForm((p) => ({ ...p, [field.id]: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl border-2 border-soft-pink bg-cream text-chocolate text-sm font-medium focus:outline-none focus:border-peach transition-colors"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-chocolate">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short product description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border-2 border-soft-pink bg-cream text-chocolate text-sm font-medium focus:outline-none focus:border-peach transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              {[
                { key: "is_available", label: "Available" },
                { key: "is_best_seller", label: "Best Seller" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as Record<string, string | boolean>)[key] as boolean}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-peach"
                  />
                  <span className="text-sm font-semibold text-chocolate">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                <Check size={16} /> {saving ? "Saving…" : editId ? "Update Product" : "Add Product"}
              </Button>
              <Button variant="secondary" size="sm" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20 text-sm text-gray-400">Loading products…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col ${!p.is_available ? "opacity-50" : ""}`}>
                <div className="relative w-full aspect-square bg-cream">
                  <Image
                    src={p.image_url ?? "https://picsum.photos/seed/product/400/400"}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                  {p.is_best_seller && (
                    <span className="absolute top-2 left-2 bg-peach text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Best Seller
                    </span>
                  )}
                  {!p.is_available && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="font-bold text-chocolate text-sm">{p.name}</h3>
                    <p className="text-peach font-extrabold">₱{Number(p.price).toFixed(2)}</p>
                    {p.stock != null && <p className="text-xs text-gray-400 mt-0.5">Stock: {p.stock}</p>}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold border-2 border-soft-pink text-chocolate rounded-xl py-2 hover:border-peach hover:text-peach transition-colors"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id || !p.is_available}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold border-2 border-soft-pink text-chocolate rounded-xl py-2 hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
