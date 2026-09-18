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

      const { error: updateError } = await query;
      if (updateError) {
        console.error("[PayMongo Webhook Update Error]", updateError.message);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
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
