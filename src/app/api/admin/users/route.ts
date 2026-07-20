import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("users")
      .select("id, name, email, phone, role, status, shop_city, created_at")
      .in("role", ["florist", "seller"])
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users: data ?? [] });
  } catch (err) {
    console.error("Admin users fetch error:", err);
    return NextResponse.json({ users: [] });
  }
}
