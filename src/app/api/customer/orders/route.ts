import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const authClient = createClient();
    const {
      data: { session },
    } = await authClient.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // 1. Get customer record linked to user_id or email or phone
    let customer = null;
    
    // Check by user_id first
    const { data: customerByUserId } = await serviceClient
      .from("customers")
      .select("id, name, email, contact_number, address")
      .eq("user_id", session.user.id)
      .maybeSingle();

    customer = customerByUserId;

    // Fallback check by email
    if (!customer && session.user.email) {
      const { data: customerByEmail } = await serviceClient
        .from("customers")
        .select("id, name, email, contact_number, address")
        .eq("email", session.user.email)
        .maybeSingle();
      customer = customerByEmail;
    }

    // Fallback check by phone from metadata
    const userPhone = session.user.user_metadata?.contact_number?.replace(/\s+/g, "");
    if (!customer && userPhone) {
      const { data: customerByPhone } = await serviceClient
        .from("customers")
        .select("id, name, email, contact_number, address")
        .eq("contact_number", userPhone)
        .maybeSingle();
      customer = customerByPhone;
    }

    if (!customer) {
      return NextResponse.json({
        success: true,
        profile: {
          name: session.user.user_metadata?.full_name || "Customer",
          email: session.user.email,
          contact_number: session.user.user_metadata?.contact_number || "",
          address: session.user.user_metadata?.address || "",
        },
        orders: [],
      });
    }

    // 2. Fetch customer's orders
    let orders = null;
    const { data: initialOrders, error: ordersError } = await serviceClient
      .from("orders")
      .select(`
        id,
        status,
        payment_status,
        payment_method,
        total_amount,
        notes,
        ordered_at,
        order_items (
          id,
          quantity,
          unit_price,
          subtotal,
          products (
            name,
            image_url
          )
        )
      `)
      .eq("customer_id", customer.id)
      .order("ordered_at", { ascending: false });

    orders = initialOrders;

    // Fallback if payment columns don't exist yet in DB
    if (ordersError && (ordersError.message.includes("column") || ordersError.code === "42703")) {
      const fallbackOrders = await serviceClient
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          notes,
          ordered_at,
          order_items (
            id,
            quantity,
            unit_price,
            subtotal,
            products (
              name,
              image_url
            )
          )
        `)
        .eq("customer_id", customer.id)
        .order("ordered_at", { ascending: false });
      orders = fallbackOrders.data;
    }

    return NextResponse.json({
      success: true,
      profile: customer,
      orders: orders || [],
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to load account data";
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
