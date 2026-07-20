import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const plan = searchParams.get("plan");
  const q = searchParams.get("q");
  const id = searchParams.get("id");
  const userId = searchParams.get("userId");

  try {
    const db = getSupabaseAdmin();

    // Lookup by owning user — used by the seller dashboard to resolve its own florist_id
    if (userId) {
      const { data, error } = await db.from("florists").select("*").eq("user_id", userId).maybeSingle();
      if (error) return NextResponse.json({ florists: [], error: error.message });
      return NextResponse.json({ florists: data ? [data] : [] });
    }

    let query = db.from("florists").select("*").eq("is_active", true);

    if (id) query = query.eq("id", id);
    if (city) query = query.ilike("city", `%${city}%`);
    if (plan) query = query.eq("plan", plan);
    if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`);

    query = query.order("rating", { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("Florists query error:", error);
      return NextResponse.json({ florists: [], error: error.message });
    }
    return NextResponse.json({ florists: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Florists fetch error:", msg);
    return NextResponse.json({ florists: [], error: msg });
  }
}
