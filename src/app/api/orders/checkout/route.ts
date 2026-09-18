import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  createPayMongoCheckoutSession,
  PayMongoLineItem,
} from "@/lib/paymongo";

interface OrderItem {
  product_id: string;
  quantity: number;
}

interface CustomerInfo {
  user_id?: string | null;
  name: string;
  email?: string;
  contact_number: string;
  address?: string;
}

interface CheckoutBody {
  customer: CustomerInfo;
  items: OrderItem[];
  payment_method?: "paymongo" | "cod";
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();

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

    const cleanPhone = body.customer.contact_number.replace(/\s+/g, "");
    if (!/^(09|\+639)\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid Philippine mobile number (e.g. 09171234567).",
        },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty. Please add items to order." },
        { status: 400 }
      );
    }

    for (const item of body.items) {
      if (!item.product_id || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: "Invalid cart item quantity." },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceClient();

    // ── Fetch and Verify Product Prices ─────────
    const productIds = body.items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, image_url, is_available")
      .in("id", productIds);

    if (productsError || !products) {
      return NextResponse.json(
        { success: false, error: "Failed to verify product availability." },
        { status: 500 }
      );
    }

    // Check availability
    const unavailable = products.filter((p) => !p.is_available);
    if (unavailable.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Some items are currently sold out: ${unavailable.map((p) => p.name).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    // Calculate total amount
    const totalAmount = body.items.reduce((sum, item) => {
      const prod = productMap[item.product_id];
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);

    // ── Customer Deduplication / Linking ─────────
    let customerId: string | null = null;

    if (body.customer.user_id) {
      const { data: existingUserCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", body.customer.user_id)
        .maybeSingle();

      if (existingUserCustomer) {
        customerId = existingUserCustomer.id;
        await supabase
          .from("customers")
          .update({
            name: body.customer.name.trim(),
            contact_number: cleanPhone,
            address: body.customer.address?.trim() ?? null,
            ...(body.customer.email ? { email: body.customer.email } : {}),
          })
          .eq("id", customerId);
      }
    }

    if (!customerId) {
      const { data: existingPhoneCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("contact_number", cleanPhone)
        .maybeSingle();

      if (existingPhoneCustomer) {
        customerId = existingPhoneCustomer.id;
        await supabase
          .from("customers")
          .update({
            name: body.customer.name.trim(),
            address: body.customer.address?.trim() ?? null,
            ...(body.customer.user_id ? { user_id: body.customer.user_id } : {}),
            ...(body.customer.email ? { email: body.customer.email } : {}),
          })
          .eq("id", customerId);
      } else {
        let { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            user_id: body.customer.user_id ?? null,
            name: body.customer.name.trim(),
            email: body.customer.email ?? null,
            contact_number: cleanPhone,
            address: body.customer.address?.trim() ?? null,
          })
          .select("id")
          .single();

        // If optional columns (user_id / email) do not exist yet in DB, retry with core fields
        if (customerError && (customerError.message.includes("column") || customerError.code === "42703")) {
          console.warn("[Customer Insert Fallback] Optional columns missing in DB, retrying with core fields:", customerError.message);
          const fallbackResult = await supabase
            .from("customers")
            .insert({
              name: body.customer.name.trim(),
              contact_number: cleanPhone,
              address: body.customer.address?.trim() ?? null,
            })
            .select("id")
            .single();
          newCustomer = fallbackResult.data;
          customerError = fallbackResult.error;
        }

        if (customerError || !newCustomer) {
          console.error("[Customer Insert Error]", customerError);
          return NextResponse.json(
            { success: false, error: customerError?.message || "Failed to save customer details." },
            { status: 500 }
          );
        }
        customerId = newCustomer.id;
      }
    }

    const paymentMethod = body.payment_method || "paymongo";

    // ── Create Order Record ──────────────────────
    let { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        status: "pending",
        payment_status: "unpaid",
        payment_method: paymentMethod,
        total_amount: totalAmount,
        notes: body.notes?.trim() ?? null,
      })
      .select("id, status, total_amount, ordered_at")
      .single();

    if (orderError && (orderError.message.includes("column") || orderError.code === "42703")) {
      console.warn("[Orders Insert Fallback] Optional columns missing in DB, retrying with core fields:", orderError.message);
      const fallbackOrder = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          status: "pending",
          total_amount: totalAmount,
          notes: body.notes?.trim() ?? null,
        })
        .select("id, status, total_amount, ordered_at")
        .single();
      order = fallbackOrder.data;
      orderError = fallbackOrder.error;
    }

    if (orderError || !order) {
      console.error("[Order Insert Error]", orderError);
      return NextResponse.json(
        { success: false, error: orderError?.message || "Failed to initialize order." },
        { status: 500 }
      );
    }

    // ── Insert Order Items ───────────────────────
    const orderItems = body.items.map((item) => {
      const prod = productMap[item.product_id];
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: prod.price,
        subtotal: prod.price * item.quantity,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      return NextResponse.json(
        { success: false, error: "Failed to save order line items." },
        { status: 500 }
      );
    }

    // Insert Admin Notification
    try {
      await supabase.from("notifications").insert({
        role_target: "admin",
        user_id: body.customer.user_id || null,
        order_id: order.id,
        title: "🎉 New Order Placed!",
        message: `${body.customer.name.trim()} placed order #${order.id.slice(0, 8).toUpperCase()} for ₱${totalAmount.toFixed(2)} (${paymentMethod === "cod" ? "COD" : "PayMongo"}).`,
        type: "order_created",
        is_read: false,
      });
    } catch {
      // Non-blocking notification insert
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    // ── PayMongo Checkout Flow ───────────────────
    if (paymentMethod === "paymongo") {
      const lineItems: PayMongoLineItem[] = body.items.map((item) => {
        const prod = productMap[item.product_id];
        return {
          name: prod.name,
          // Amount in centavos (PHP * 100)
          amount: Math.round(prod.price * 100),
          currency: "PHP",
          quantity: item.quantity,
          images: prod.image_url ? [prod.image_url] : undefined,
        };
      });

      const successUrl = `${origin}/order/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/order?cancelled=true`;

      try {
        const session = await createPayMongoCheckoutSession({
          orderId: order.id,
          lineItems,
          billing: {
            name: body.customer.name.trim(),
            email: body.customer.email,
            phone: cleanPhone,
            address: {
              line1: body.customer.address?.trim(),
            },
          },
          successUrl,
          cancelUrl,
        });

        // Save session id to order
        await supabase
          .from("orders")
          .update({
            paymongo_session_id: session.data.id,
          })
          .eq("id", order.id);

        return NextResponse.json({
          success: true,
          payment_method: "paymongo",
          checkout_url: session.data.attributes.checkout_url,
          order_id: order.id,
        });
      } catch (paymongoErr: unknown) {
        const errorMsg =
          paymongoErr instanceof Error
            ? paymongoErr.message
            : "PayMongo Checkout initialization failed.";
        console.error("[PayMongo Checkout Error]", errorMsg);

        return NextResponse.json(
          {
            success: false,
            error: errorMsg,
          },
          { status: 500 }
        );
      }
    }

    // ── COD Fallback Flow ─────────────────────────
    return NextResponse.json({
      success: true,
      payment_method: "cod",
      redirect_url: `/order/success?order_id=${order.id}`,
      order_id: order.id,
    });
  } catch (err: unknown) {
    console.error("[POST /api/orders/checkout]", err);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
