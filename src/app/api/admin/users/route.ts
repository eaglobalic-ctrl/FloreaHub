import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
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
