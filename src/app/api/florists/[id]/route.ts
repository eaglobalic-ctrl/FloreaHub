import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getSupabaseAdmin();
    const { data: florist, error } = await db.from("florists").select("*").eq("id", id).single();
    if (error || !florist) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: products } = await db.from("products").select("*").eq("florist_id", id).eq("is_active", true).order("rating", { ascending: false });
    const { data: reviews } = await db.from("reviews").select("*").eq("florist_id", id).order("created_at", { ascending: false }).limit(10);

    return NextResponse.json({ florist, products: products ?? [], reviews: reviews ?? [] });
  } catch (err) {
    console.error("Florist detail error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
