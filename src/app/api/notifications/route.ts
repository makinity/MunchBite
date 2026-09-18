import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    const authClient = createClient();
    const {
      data: { session },
    } = await authClient.auth.getSession();

    const serviceClient = createServiceClient();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope"); // 'admin' | 'customer'

    // Check if requester is admin
    let isAdmin = false;
    if (session?.user) {
      const userMeta = session.user.user_metadata || {};
      if (userMeta.role === "admin") {
        isAdmin = true;
      } else {
        const { data: adminRow } = await serviceClient
          .from("admins")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();
        if (adminRow) isAdmin = true;
      }
    }

    let query = serviceClient
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (scope === "admin" || (isAdmin && !scope)) {
      query = query.or("role_target.eq.admin,role_target.eq.all");
    } else if (session?.user) {
      query = query.or(`user_id.eq.${session.user.id},role_target.eq.customer,role_target.eq.all`);
    } else {
      // Guest: can only see general customer notifications
      query = query.eq("role_target", "customer");
    }

    const { data: notifications, error } = await query;

    if (error) {
      // Fallback gracefully if notifications table does not exist yet
      if (error.code === "42P01" || error.message.includes("does not exist") || error.code === "PGRST205") {
        return NextResponse.json({ success: true, data: [], unreadCount: 0 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      data: notifications || [],
      unreadCount,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to fetch notifications";
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, role_target = "customer", order_id, title, message, type = "general" } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from("notifications")
      .insert({
        user_id: user_id || null,
        role_target,
        order_id: order_id || null,
        title,
        message,
        type,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist yet, don't crash the parent flow
      console.warn("[Notifications Insert Warning]:", error.message);
      return NextResponse.json({ success: true, data: null, warning: error.message });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to create notification";
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
