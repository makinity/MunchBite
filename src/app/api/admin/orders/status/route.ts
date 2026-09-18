import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "Order ID and status are required." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id, status, customer_id, customers (user_id, name)")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Status message map
    const statusMessages: Record<string, { title: string; message: string }> = {
      confirmed: {
        title: "✅ Order Confirmed!",
        message: `Your order #${orderId.slice(0, 8).toUpperCase()} has been confirmed and queued for baking.`,
      },
      preparing: {
        title: "🍪 Baking in Progress!",
        message: `Our bakers are freshly preparing your order #${orderId.slice(0, 8).toUpperCase()} right now.`,
      },
      ready: {
        title: "🛵 Order Ready for Delivery!",
        message: `Your order #${orderId.slice(0, 8).toUpperCase()} is packed and ready for delivery/pickup.`,
      },
      delivered: {
        title: "🎉 Order Delivered!",
        message: `Your order #${orderId.slice(0, 8).toUpperCase()} was marked as delivered. Enjoy your sweet treats!`,
      },
      cancelled: {
        title: "❌ Order Cancelled",
        message: `Your order #${orderId.slice(0, 8).toUpperCase()} has been cancelled. Contact us if you have questions.`,
      },
    };

    const statusInfo = statusMessages[status];
    if (statusInfo) {
      try {
        const customerUserId = (updatedOrder?.customers as { user_id?: string } | null)?.user_id;
        await supabase.from("notifications").insert({
          user_id: customerUserId || null,
          role_target: "customer",
          order_id: orderId,
          title: statusInfo.title,
          message: statusInfo.message,
          type: "status_change",
          is_read: false,
        });
      } catch {
        // Non-blocking notification insert
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to update status";
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
