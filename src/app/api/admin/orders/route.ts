import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const supabase = createServiceClient();

    // 1. Try full select with payment columns
    let query = supabase
      .from("orders")
      .select(`
        id,
        status,
        payment_status,
        payment_method,
        total_amount,
        notes,
        ordered_at,
        customers (
          name,
          contact_number,
          address
        ),
        order_items (
          id,
          quantity,
          unit_price,
          subtotal,
          products (
            name
          )
        )
      `)
      .order("ordered_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    let orders: Record<string, unknown>[] | null = null;
    let error = null;
    const { data: initialOrders, error: queryError } = await query;
    orders = initialOrders as Record<string, unknown>[] | null;
    error = queryError;

    // 2. Fallback to core columns if payment columns don't exist yet in DB
    if (error && (error.message.includes("column") || error.code === "42703")) {
      console.warn("[Admin Orders Fallback] Optional columns missing in DB, selecting core fields:", error.message);
      let fallbackQuery = supabase
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          notes,
          ordered_at,
          customers (
            name,
            contact_number,
            address
          ),
          order_items (
            id,
            quantity,
            unit_price,
            subtotal,
            products (
              name
            )
          )
        `)
        .order("ordered_at", { ascending: false });

      if (status && status !== "all") {
        fallbackQuery = fallbackQuery.eq("status", status);
      }

      const fallbackResult = await fallbackQuery;
      orders = fallbackResult.data as Record<string, unknown>[] | null;
      error = fallbackResult.error;
    }

    if (error) {
      console.error("[Admin Orders Fetch Error]", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: orders || [] });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to fetch orders.";
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
