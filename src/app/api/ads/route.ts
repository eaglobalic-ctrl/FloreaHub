import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const floristId = searchParams.get("floristId");
  const all = searchParams.get("all");

  try {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from("ads").select("*");

    if (!all) {
      query = query.eq("status", "active").gt("end_date", new Date().toISOString());
    }
    if (type) query = query.eq("type", type);
    if (floristId) query = query.eq("florist_id", floristId);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ads: data ?? [] });
  } catch (err) {
    console.error("Ads fetch error:", err);
    return NextResponse.json({ ads: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, clicks, impressions } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (typeof clicks === "number") updates.clicks = clicks;
    if (typeof impressions === "number") updates.impressions = impressions;

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("ads").update(updates).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ads update error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
