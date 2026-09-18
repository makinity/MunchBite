import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { retrievePayMongoCheckoutSession } from "@/lib/paymongo";

export async function POST(req: NextRequest) {
  try {
    const { order_id, session_id } = await req.json();

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // If session_id is provided, verify with PayMongo API
    if (session_id) {
      try {
        const session = await retrievePayMongoCheckoutSession(session_id);
        const payments = session.data.attributes.payments || [];
        const isPaid =
          payments.some((p) => p.attributes.status === "paid") ||
          session.data.attributes.status === "paid";
        const paymentId = payments[0]?.id;

        if (isPaid) {
          // Attempt update with payment_status, fallback to status only if column missing
          const { error: updateErr } = await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              status: "confirmed",
              paymongo_payment_id: paymentId || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order_id);

          if (updateErr && (updateErr.message.includes("column") || updateErr.code === "42703")) {
            await supabase
              .from("orders")
              .update({
                status: "confirmed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", order_id);
          }
        }
      } catch (paymongoErr) {
        console.warn("[Verify PayMongo Error]", paymongoErr);
      }
    }

    let order: Record<string, unknown> | null = null;
    let orderError = null;
    const { data: initialOrder, error: queryError } = await supabase
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
      .eq("id", order_id)
      .single();

    order = initialOrder as Record<string, unknown> | null;
    orderError = queryError;

    if (orderError && (orderError.message.includes("column") || orderError.code === "42703")) {
      const fallbackResult = await supabase
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
        .eq("id", order_id)
        .single();
      order = fallbackResult.data as Record<string, unknown> | null;
      orderError = fallbackResult.error;
    }

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err: unknown) {
    console.error("[POST /api/orders/verify]", err);
    return NextResponse.json(
      { success: false, error: "Failed to verify order status." },
      { status: 500 }
    );
  }
}
