import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId, markAll, role_target, userId } = body;

    const serviceClient = createServiceClient();

    if (markAll) {
      let query = serviceClient.from("notifications").update({ is_read: true });
      if (role_target === "admin") {
        query = query.eq("role_target", "admin");
      } else if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.neq("id", "00000000-0000-0000-0000-000000000000");
      }
      await query;
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      await serviceClient
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to mark as read";
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
