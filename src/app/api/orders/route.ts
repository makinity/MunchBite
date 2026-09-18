import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface OrderItem {
  product_id: string;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  contact_number: string;
  address?: string;
}

interface OrderBody {
  customer: CustomerInfo;
  items: OrderItem[];
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderBody = await req.json();

    // ── Validation ──────────────────────────────
    if (!body.customer?.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name is required." },
        { status: 400 }
      );
    }

    if (!body.customer?.contact_number?.trim()) {
      return NextResponse.json(
        { success: false, error: "Contact number is required." },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item." },
        { status: 400 }
      );
    }

    for (const item of body.items) {
      if (!item.product_id || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: "Invalid order item." },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceClient();

    // ── Fetch product prices (snapshot at order time) ──
    const productIds = body.items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, is_available")
      .in("id", productIds);

    if (productsError || !products) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch product details." },
        { status: 500 }
      );
    }

    // Ensure all products are available
    const unavailable = products.filter((p) => !p.is_available);
    if (unavailable.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Some items are no longer available: ${unavailable.map((p) => p.name).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Build price map
    const priceMap = Object.fromEntries(products.map((p) => [p.id, p.price]));

    // Calculate total
    const totalAmount = body.items.reduce((sum, item) => {
      return sum + (priceMap[item.product_id] ?? 0) * item.quantity;
    }, 0);

    // ── Insert Customer ──────────────────────────
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: body.customer.name.trim(),
        contact_number: body.customer.contact_number.trim(),
        address: body.customer.address?.trim() ?? null,
      })
      .select("id")
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: "Failed to save customer information." },
        { status: 500 }
      );
    }

    // ── Insert Order ─────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customer.id,
        status: "pending",
        total_amount: totalAmount,
        notes: body.notes?.trim() ?? null,
      })
      .select("id, status, total_amount, ordered_at")
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Failed to create order." },
        { status: 500 }
      );
    }

    // ── Insert Order Items ───────────────────────
    const orderItems = body.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: priceMap[item.product_id],
      subtotal: priceMap[item.product_id] * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      return NextResponse.json(
        { success: false, error: "Failed to save order items." },
        { status: 500 }
      );
    }

    // ── Success ──────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: {
          order_id: order.id,
          status: order.status,
          total_amount: order.total_amount,
          ordered_at: order.ordered_at,
        },
        message: "Order placed successfully! We will contact you shortly.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
