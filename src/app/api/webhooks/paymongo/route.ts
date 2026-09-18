import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const eventType = event?.data?.attributes?.type;
    const eventData = event?.data?.attributes?.data;

    console.log(`[PayMongo Webhook Received] Type: ${eventType}`);

    const supabase = createServiceClient();

    if (eventType === "checkout_session.payment.paid") {
      const sessionId = eventData?.id;
      const metadataOrderId = eventData?.attributes?.metadata?.order_id;
      const payments = eventData?.attributes?.payments || [];
      const primaryPayment = payments[0];
      const paymentId = primaryPayment?.id;

      let query = supabase.from("orders").update({
        payment_status: "paid",
        status: "confirmed",
        paymongo_payment_id: paymentId || null,
        updated_at: new Date().toISOString(),
      });

      if (metadataOrderId) {
        query = query.eq("id", metadataOrderId);
      } else if (sessionId) {
        query = query.eq("paymongo_session_id", sessionId);
      } else {
        console.warn("[PayMongo Webhook] No order identifier found in payload.");
        return NextResponse.json({ received: true, warning: "No identifier" });
      }

      const { data: updatedOrders, error: updateError } = await query
        .select("id, total_amount, customer_id, customers (user_id, name)");

      if (updateError) {
        console.error("[PayMongo Webhook Update Error]", updateError.message);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      // Send notifications
      const paidOrder = updatedOrders?.[0];
      if (paidOrder) {
        try {
          const custUser = (paidOrder.customers as { user_id?: string; name?: string } | null);
          // Admin notification
          await supabase.from("notifications").insert({
            role_target: "admin",
            order_id: paidOrder.id,
            title: "💰 Payment Received!",
            message: `Order #${paidOrder.id.slice(0, 8).toUpperCase()} (₱${Number(paidOrder.total_amount).toFixed(2)}) was successfully paid via PayMongo.`,
            type: "payment_success",
            is_read: false,
          });

          // Customer notification
          await supabase.from("notifications").insert({
            user_id: custUser?.user_id || null,
            role_target: "customer",
            order_id: paidOrder.id,
            title: "💳 Payment Confirmed!",
            message: `We've received your payment of ₱${Number(paidOrder.total_amount).toFixed(2)} for order #${paidOrder.id.slice(0, 8).toUpperCase()}. Thank you!`,
            type: "payment_success",
            is_read: false,
          });
        } catch {
          // Non-blocking notification insert
        }
      }

      console.log(`[PayMongo Webhook] Order marked as PAID successfully.`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Webhook processing error";
    console.error("[PayMongo Webhook Error]", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }
}
