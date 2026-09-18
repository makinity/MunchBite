import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authClient = createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ isLoggedIn: false, isAdmin: false });
    }

    const serviceClient = createServiceClient();

    // Check if user is in admins table
    let isAdmin = false;
    let adminName: string | null = null;

    // 1. Check by user id
    const { data: adminById } = await serviceClient
      .from("admins")
      .select("id, name, email")
      .eq("id", user.id)
      .maybeSingle();

    if (adminById) {
      isAdmin = true;
      adminName = adminById.name;
    }

    // 2. Check by email (case-insensitive)
    if (!isAdmin && user.email) {
      const { data: adminByEmail } = await serviceClient
        .from("admins")
        .select("id, name, email")
        .ilike("email", user.email.trim())
        .maybeSingle();

      if (adminByEmail) {
        isAdmin = true;
        adminName = adminByEmail.name;
      }
    }

    // 3. Check user metadata or app metadata
    if (!isAdmin) {
      if (
        user.user_metadata?.role === "admin" ||
        user.app_metadata?.role === "admin"
      ) {
        isAdmin = true;
      }
    }

    return NextResponse.json({
      isLoggedIn: true,
      isAdmin,
      user: {
        id: user.id,
        email: user.email,
        name: adminName || user.user_metadata?.full_name || "User",
        role: isAdmin ? "admin" : "customer",
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to verify role";
    return NextResponse.json({ isLoggedIn: false, isAdmin: false, error: errMsg });
  }
}
