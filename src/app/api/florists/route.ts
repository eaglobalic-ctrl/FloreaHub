import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const plan = searchParams.get("plan");
  const q = searchParams.get("q");
  const id = searchParams.get("id");

  try {
    const db = getSupabaseAdmin();
    let query = db.from("florists").select("*").eq("is_active", true);

    if (id) query = query.eq("id", id);
    if (city) query = query.ilike("city", `%${city}%`);
    if (plan) query = query.eq("plan", plan);
    if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`);

    query = query.order("rating", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ florists: data ?? [] });
  } catch (err) {
    console.error("Florists fetch error:", err);
    return NextResponse.json({ florists: [] });
  }
}
