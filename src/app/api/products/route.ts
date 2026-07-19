import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const floristId = searchParams.get("floristId");
  const q = searchParams.get("q");
  const maxPrice = searchParams.get("maxPrice");
  const sameDay = searchParams.get("sameDay");
  const sort = searchParams.get("sort") ?? "popular";

  try {
    const db = getSupabaseAdmin();
    let query = db.from("products").select("*, florists(name, city)").eq("is_active", true);

    if (category && category !== "all") query = query.eq("category", category);
    if (floristId) query = query.eq("florist_id", floristId);
    if (q) query = query.ilike("name", `%${q}%`);
    if (maxPrice) query = query.lte("price", Number(maxPrice));
    if (sameDay === "true") query = query.eq("same_day", true);

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else if (sort === "rating") query = query.order("rating", { ascending: false });
    else query = query.order("review_count", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    console.error("Products fetch error:", err);
    return NextResponse.json({ products: [] });
  }
}
