import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");
  const floristId = searchParams.get("floristId");
  const q = searchParams.get("q");
  const maxPrice = searchParams.get("maxPrice");
  const sameDay = searchParams.get("sameDay");
  const sort = searchParams.get("sort") ?? "popular";

  try {
    const db = getSupabaseAdmin();

    // Single product by ID
    if (id) {
      const { data, error } = await db
        .from("products")
        .select("*, florists(id, name, city, state, cover_image, rating, review_count, same_day_delivery, phone)")
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (error) return NextResponse.json({ product: null });
      return NextResponse.json({ product: data });
    }

    let query = db.from("products").select("*, florists(id, name, city)").eq("is_active", true);

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

export async function POST(req: NextRequest) {
  try {
    const { floristId, name, description, price, category, imageUrl, stock, sameDay } = await req.json();
    if (!floristId || !name || !price) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Only an approved, active florist can list products
    const { data: florist } = await db.from("florists").select("id").eq("id", floristId).eq("is_active", true).maybeSingle();
    if (!florist) return NextResponse.json({ error: "Florist not found or not active" }, { status: 403 });

    const { data: product, error } = await db.from("products").insert({
      florist_id: floristId,
      name,
      description: description ?? null,
      price,
      category: category ?? "daily",
      image_url: imageUrl ?? null,
      stock: stock ?? 0,
      same_day: !!sameDay,
    }).select("*").single();

    if (error) throw error;
    return NextResponse.json({ product });
  } catch (err) {
    console.error("Product create error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
