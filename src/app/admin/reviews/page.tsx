"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Check, Trash2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Review {
  id: string;
  customer_name: string;
  content: string;
  rating: number;
  is_published: boolean;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "pending") query = query.eq("is_published", false);
    if (filter === "published") query = query.eq("is_published", true);
    const { data } = await query;
    setReviews((data as Review[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const approve = async (id: string) => {
    setProcessingId(id);
    const supabase = createClient();
    await supabase.from("reviews").update({ is_published: true }).eq("id", id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_published: true } : r));
    setProcessingId(null);
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setProcessingId(id);
    const supabase = createClient();
    await supabase.from("reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setProcessingId(null);
  };

  const pending = reviews.filter((r) => !r.is_published).length;

  return (
    <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {(["all", "pending", "published"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                  filter === f ? "bg-chocolate text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-chocolate"
                }`}
              >
                {f}{f === "pending" && pending > 0 ? ` (${pending})` : ""}
              </button>
            ))}
          </div>
          <button onClick={fetchReviews} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-chocolate transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Reviews */}
        {loading ? (
          <div className="text-center py-20 text-sm text-gray-400">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-sm text-gray-400">No reviews found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4 ${!review.is_published ? "border-2 border-yellow-200" : ""}`}
              >
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${review.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {review.is_published ? "Published" : "Pending Approval"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < review.rating ? "fill-peach text-peach" : "fill-gray-200 text-gray-200"} />
                  ))}
                </div>

                {/* Content */}
                <p className="text-sm text-chocolate font-medium italic leading-relaxed flex-1">
                  &ldquo;{review.content}&rdquo;
                </p>
                <p className="text-xs font-bold text-gray-500">— {review.customer_name}</p>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {!review.is_published && (
                    <button
                      onClick={() => approve(review.id)}
                      disabled={processingId === review.id}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-green-50 text-green-700 rounded-xl py-2 hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      <Check size={13} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    disabled={processingId === review.id}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-xl py-2 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
